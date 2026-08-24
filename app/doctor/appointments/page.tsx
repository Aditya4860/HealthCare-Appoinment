import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { formatIST } from "@/lib/timezone";
import { ArrowLeft, Search, Filter } from "lucide-react";

export const metadata = { title: "My Appointments — MediBook" };

export default async function DoctorAppointmentsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "DOCTOR") redirect("/login");

  const filter = searchParams.filter || "all";

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  // Build the Prisma where clause based on the filter
  let whereClause: any = { doctorId: session.userId };
  let pageTitle = "All Appointments";

  if (filter === "today") {
    whereClause.scheduledAt = { gte: startOfDay, lt: endOfDay };
    whereClause.status = { not: "CANCELLED" };
    pageTitle = "Today's Appointments";
  } else if (filter === "week") {
    whereClause.scheduledAt = { gte: startOfWeek };
    whereClause.status = { not: "CANCELLED" };
    pageTitle = "This Week's Appointments";
  } else if (filter === "completed") {
    whereClause.status = "COMPLETED";
    pageTitle = "Completed Appointments";
  } else {
    // "all" or any other value
    // Show all except maybe we can order them
  }

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: { patient: true },
    orderBy: { scheduledAt: filter === "completed" ? "desc" : "asc" },
  });

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName={session.name || "Doctor"} role="DOCTOR" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/doctor/dashboard"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 text-sm font-inter"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold font-sora text-brand">
            {pageTitle}
          </h1>

          <div className="flex flex-wrap gap-2">
            <Link href="/doctor/appointments?filter=today">
              <Button
                variant={filter === "today" ? "default" : "outline"}
                size="sm"
                className={filter === "today" ? "bg-brand hover:bg-brand/90 text-white" : "text-brand border-brand/20"}
              >
                Today
              </Button>
            </Link>
            <Link href="/doctor/appointments?filter=week">
              <Button
                variant={filter === "week" ? "default" : "outline"}
                size="sm"
                className={filter === "week" ? "bg-brand hover:bg-brand/90 text-white" : "text-brand border-brand/20"}
              >
                This Week
              </Button>
            </Link>
            <Link href="/doctor/appointments?filter=completed">
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                className={filter === "completed" ? "bg-brand hover:bg-brand/90 text-white" : "text-brand border-brand/20"}
              >
                Completed
              </Button>
            </Link>
            <Link href="/doctor/appointments?filter=all">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                className={filter === "all" ? "bg-brand hover:bg-brand/90 text-white" : "text-brand border-brand/20"}
              >
                All
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {appointments.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-inter">
              <p>No appointments found matching this filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((app) => {
                const dateStr = formatIST(app.scheduledAt, "EEE, MMM d, yyyy");
                const timeStr = formatIST(app.scheduledAt, "hh:mm a");
                return (
                  <div
                    key={app.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-4 group"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-slate-800 font-inter text-lg group-hover:text-brand transition-colors">
                          {app.patient.name}
                        </h3>
                        <StatusBadge status={app.status as any} />
                        {app.urgencyLevel && (
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                              app.urgencyLevel === "High"
                                ? "bg-danger/10 text-danger"
                                : "bg-warn/10 text-warn-700"
                            }`}
                          >
                            {app.urgencyLevel}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 font-inter mt-1">
                        {dateStr} &middot; {timeStr}
                      </p>
                      {app.chiefConcern && (
                        <p className="text-sm text-slate-600 font-inter mt-2 line-clamp-1">
                          <span className="font-medium">Concern:</span>{" "}
                          {app.chiefConcern}
                        </p>
                      )}
                    </div>
                    <Link href={`/doctor/appointments/${app.id}`}>
                      <Button
                        variant="outline"
                        className="text-brand border-brand/20 hover:bg-brand hover:text-white font-medium font-inter w-full md:w-auto shadow-sm transition-all"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
