import { formatIST, isSlotInPastIST, parseISTToUTC } from "./lib/timezone";

function runTests() {
  console.log("=== TIMEZONE TESTS ===\n");

  const now = new Date();
  console.log(`Current True UTC Instant: ${now.toISOString()}`);
  console.log(`Current IST Display: ${formatIST(now, "yyyy-MM-dd hh:mm:ss a 'IST'")}`);

  // Test 1: Future slot
  // Pick tomorrow
  const tmrw = new Date(now.getTime() + 86400000);
  const tmrwDateStr = formatIST(tmrw, "yyyy-MM-dd");
  const isPastTmrw = isSlotInPastIST(tmrwDateStr, "10:00");
  console.log(`\nTest 1 (Future Slot: ${tmrwDateStr} 10:00)`);
  console.log(`Expected: false, Actual: ${isPastTmrw}`);

  // Test 2: Past slot today
  // Try to book a slot that is 1 minute ago in IST
  const oneMinAgo = new Date(now.getTime() - 60000);
  const todayStr = formatIST(oneMinAgo, "yyyy-MM-dd");
  const pastTimeStr = formatIST(oneMinAgo, "HH:mm");
  const isPastToday = isSlotInPastIST(todayStr, pastTimeStr);
  console.log(`\nTest 2 (Past Slot Today: ${todayStr} ${pastTimeStr})`);
  console.log(`Expected: true, Actual: ${isPastToday}`);

  // Test 3: Upcoming slot today
  // Try to book a slot that is 1 hour from now
  const oneHrFuture = new Date(now.getTime() + 3600000);
  const todayStr2 = formatIST(oneHrFuture, "yyyy-MM-dd");
  const futureTimeStr = formatIST(oneHrFuture, "HH:mm");
  const isPastTodayFuture = isSlotInPastIST(todayStr2, futureTimeStr);
  console.log(`\nTest 3 (Upcoming Slot Today: ${todayStr2} ${futureTimeStr})`);
  console.log(`Expected: false, Actual: ${isPastTodayFuture}`);

  // Test 4: Database Storage format check
  const parsed = parseISTToUTC("2026-08-25", "10:00");
  // 10:00 IST is 04:30 UTC
  console.log(`\nTest 4 (DB Storage for 2026-08-25 10:00)`);
  console.log(`Expected UTC: 2026-08-25T04:30:00.000Z`);
  console.log(`Actual UTC  : ${parsed.toISOString()}`);
  console.log(`Formatted back to IST: ${formatIST(parsed, "yyyy-MM-dd hh:mm a")}`);

}

runTests();
