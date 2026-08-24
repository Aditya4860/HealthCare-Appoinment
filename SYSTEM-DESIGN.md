# HealthSync — System Design Write-Up

## 1. Double-Booking Prevention

The core guarantee is a **unique composite index** on the `Appointment` table:

```sql
@@unique([doctorId, date, timeSlot])
```

This means the database will reject—at the constraint level—any second insertion that targets the same doctor, date, and time slot. No application-layer logic alone can provide this guarantee reliably, because two concurrent requests could both pass a "does this slot exist?" check before either one writes. By pushing the uniqueness constraint to the database, exactly one write wins; the other receives a Prisma `P2002` unique-constraint violation error.

At the API layer (`POST /api/appointments`), the booking flow follows this sequence:

1. Verify the doctor exists and is not on leave for the requested date.
2. Attempt a Prisma `create` inside a **serializable transaction**. Because Prisma wraps the write in a transaction, the database acquires a row-level lock for the duration of the write.
3. If the write succeeds, return `201 Created`.
4. If Prisma throws a `P2002` error, return `409 Conflict` with the message *"This slot is no longer available."*

The combination of the unique constraint and the transaction means the API is safe under concurrent load without any external locking service or queue.

---

## 2. Doctor Leave Conflict Handling

When an admin marks a doctor on leave for a specific date (via `PATCH /api/doctors/[id]/leave`), the system performs the following steps atomically inside a single Prisma transaction:

**Step 1 — Record the leave date.** The target date is appended to the `Doctor.leaveDate` array.

**Step 2 — Query affected appointments.** All `CONFIRMED` or `PENDING` appointments for that doctor on that date are fetched.

**Step 3 — Cancel affected appointments.** Each appointment's status is set to `CANCELLED`. This happens inside the same transaction, so the leave date and cancellations are always consistent—either both are committed or neither is.

**Step 4 — Enqueue cancellation notifications.** For every cancelled appointment a `Notification` record is created with `status: PENDING`. Notification delivery is handled asynchronously (see section 4), so the transaction is not blocked by email latency.

When a patient subsequently tries to book on a leave date, the API's pre-write check reads the `leaveDate` array and returns `400 Bad Request` before ever attempting an insert.

The available-slots endpoint (`GET /api/appointments/slots`) filters leave dates out of the response entirely, so the UI never presents them as options.

---

## 3. Slot Hold Mechanism

A traditional "slot hold" requires a background sweeper to expire stale holds, which adds operational complexity. Given the constraint of no external queue (no Redis, no BullMQ), HealthSync uses a **lightweight optimistic-locking pattern** instead.

When a patient opens the booking form, the frontend fetches currently available slots. No hold is created at this point. When they submit the form, the API attempts the write immediately. If the slot was taken in the window between the patient loading the page and submitting the form, the unique constraint rejects the write and returns `409 Conflict`. The UI then re-fetches the slot list and prompts the patient to pick an available alternative.

This "last-write-wins with instant feedback" pattern is appropriate for a healthcare scheduler where booking windows are minutes long rather than seconds, and where the cost of showing a brief conflict message is far lower than the cost of building and maintaining a distributed hold system.

For additional safety, the available-slots endpoint response sets `Cache-Control: no-store`, ensuring the patient always sees the freshest slot availability rather than a cached stale response.

---

## 4. Notification Failure Handling

Email delivery (via Resend) is **decoupled from appointment state**. An appointment is created and confirmed in the database before any email is sent. If the email call fails, the appointment record is not rolled back.

**How it works:**

Every outbound notification is first written to the `Notification` table with `status: PENDING`. A separate async function then calls the Resend API. On success the record is updated to `status: SENT` and `sentAt` is populated. On failure it is updated to `status: FAILED` and `retryCount` is incremented.

**Retry strategy via Vercel Cron:**

A cron job at `/api/cron/retry-notifications` runs every 15 minutes. It fetches all `Notification` records where `status = FAILED` and `retryCount < 3`. For each, it re-attempts the Resend call. After three failed attempts the record is left as `FAILED` with `retryCount = 3`—it will no longer be picked up by the cron, but it remains in the table for manual inspection or alerting.

The cron endpoint is protected by a shared secret (`x-cron-secret` header) so it cannot be triggered externally.

**Why this is safe:**

- The appointment always exists regardless of email outcome. Patients can log in and view their appointment in the dashboard even if no confirmation email arrived.
- The `Notification` table gives the admin full visibility into delivery failures.
- The retry cap of three prevents indefinite hammering of a broken Resend key or recipient address, while still tolerating transient network errors.
- Separation of concerns means a Resend outage degrades notification reliability but never corrupts booking data.

---

*Total: ~750 words*
