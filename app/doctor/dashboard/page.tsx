import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatIST, getCurrentISTDate } from "@/lib/timezone";
import { generateSlots } from "@/lib/booking";
import { Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Doctor Dashboard — MediBook" };

export default async function DoctorDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "DOCTOR") redirect("/login");

  const doctor = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { doctorProfile: true, calendarToken: true }
  });

  if (!doctor || !doctor.doctorProfile) {
    return <div>Doctor profile not found</div>;
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const [todayCount, weekCount, completedCount, pendingReviewCount] = await Promise.all([
    prisma.appointment.count({
      where: { doctorId: session.userId, scheduledAt: { gte: startOfDay, lt: endOfDay }, status: { not: "CANCELLED" } }
    }),
    prisma.appointment.count({
      where: { doctorId: session.userId, scheduledAt: { gte: startOfWeek }, status: { not: "CANCELLED" } }
    }),
    prisma.appointment.count({
      where: { doctorId: session.userId, status: "COMPLETED" }
    }),
    prisma.appointment.count({
      where: { doctorId: session.userId, status: "CONFIRMED" }
    }),
  ]);

  const appointmentsToday = await prisma.appointment.findMany({
    where: {
      doctorId: session.userId,
      scheduledAt: { gte: startOfDay, lt: endOfDay },
      status: { not: "CANCELLED" }
    },
    include: { patient: true },
    orderBy: { scheduledAt: "asc" }
  });

  const upcoming = await prisma.appointment.findMany({
    where: {
      doctorId: session.userId,
      scheduledAt: { gte: endOfDay },
      status: { notIn: ["CANCELLED", "COMPLETED"] }
    },
    include: { patient: true },
    orderBy: { scheduledAt: "asc" },
    take: 5
  });

  // Weekly activity counts per day (Sun–Sat)
  const weeklyApps = await prisma.appointment.findMany({
    where: {
      doctorId: session.userId,
      scheduledAt: { gte: startOfWeek, lt: endOfDay },
      status: { not: "CANCELLED" }
    },
    select: { scheduledAt: true }
  });
  const dayCounts = Array(7).fill(0);
  weeklyApps.forEach(a => {
    const d = new Date(a.scheduledAt).getDay();
    dayCounts[d]++;
  });
  const maxCount = Math.max(...dayCounts, 1);
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let wh = { start: "09:00", end: "17:00" };
  try { wh = JSON.parse(doctor.doctorProfile.workingHours); } catch {}
  const allSlots = generateSlots(wh, doctor.doctorProfile.slotDuration);

  const timeline = allSlots.map(time => {
    const matchingApp = appointmentsToday.find(a => {
      const t = `${a.scheduledAt.getHours().toString().padStart(2, "0")}:${a.scheduledAt.getMinutes().toString().padStart(2, "0")}`;
      return t === time;
    });
    return { time, appointment: matchingApp };
  });

  const stats = [
    { label: "Today", value: todayCount, href: "/doctor/appointments?filter=today" },
    { label: "This Week", value: weekCount, href: "/doctor/appointments?filter=week" },
    { label: "Completed", value: completedCount, href: "/doctor/appointments?filter=completed" },
    { label: "Pending Review", value: pendingReviewCount, href: "/doctor/appointments" },
  ];

  return (
    <DashboardLayout role="DOCTOR" userName={doctor.name?.split(" ")[0] || "Doctor"} pageTitle="Dashboard">
      {/* Calendar connect banner */}
      {!doctor.calendarToken && (
        <div className="mb-6 bg-[#EDE9FF] border border-[#7C6FCD]/20 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-[#7C6FCD]" />
            <span className="text-sm font-medium text-[#1B3A6B]">Connect Google Calendar to sync your appointments</span>
          </div>
          <a href="/api/calendar/auth">
            <Button size="sm" className="bg-[#7C6FCD] hover:bg-[#6B5EBC] text-white rounded-xl text-xs">Connect</Button>
          </a>
        </div>
      )}
      {doctor.calendarToken && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-600" />
          <span className="text-sm font-medium text-green-700">Google Calendar connected</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group block">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm cursor-pointer hover:border-[#7C6FCD] hover:shadow-md transition-all">
              <p className="text-4xl font-bold text-[#1B3A6B] group-hover:text-[#7C6FCD] transition-colors">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              <span className="text-[#7C6FCD] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">
                View →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-[#0F172A] mb-4">Today&apos;s Schedule</h2>
          {appointmentsToday.length > 0 ? (
            <div className="space-y-3">
              {timeline.filter(s => s.appointment || appointmentsToday.length < 8).map((slot, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-14 text-right text-xs text-slate-400 font-medium pt-3.5 flex-shrink-0">{slot.time}</div>
                  <div className="flex-1">
                    {slot.appointment ? (
                      <div className="bg-white rounded-xl border-l-4 border-l-[#7C6FCD] border border-slate-200 shadow-sm p-4 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EDE9FF] text-[#7C6FCD] flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {slot.appointment.patient.name?.substring(0, 2).toUpperCase() || "PT"}
                            </div>
                            <span className="font-semibold text-slate-800 text-sm">{slot.appointment.patient.name}</span>
                          </div>
                          <StatusBadge status={slot.appointment.status as any} />
                        </div>
                        {slot.appointment.urgencyLevel && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${slot.appointment.urgencyLevel === "High" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                              {slot.appointment.urgencyLevel}
                            </span>
                            <span className="text-xs text-slate-400">{slot.appointment.chiefConcern}</span>
                          </div>
                        )}
                        <Link href={`/doctor/appointments/${slot.appointment.id}`} className="text-[#7C6FCD] text-xs font-medium hover:underline">
                          View & Complete →
                        </Link>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-100 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-center bg-slate-50/50 h-full min-h-[52px]">
                        Available
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <p className="text-slate-400 text-sm">No appointments today.</p>
              <p className="text-slate-300 text-xs mt-1">Enjoy your free day!</p>
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#0F172A]">Upcoming</h2>
            <Link href="/doctor/appointments" className="text-xs text-[#7C6FCD] font-medium hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {upcoming.length > 0 ? upcoming.map(app => {
              const dateStr = formatIST(app.scheduledAt, "EEE, MMM d");
              const timeStr = formatIST(app.scheduledAt, "hh:mm a");
              return (
                <Link key={app.id} href={`/doctor/appointments/${app.id}`} className="block bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#7C6FCD]/30 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-full bg-[#EDE9FF] text-[#7C6FCD] flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {app.patient.name?.substring(0, 2).toUpperCase() || "PT"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{app.patient.name}</p>
                      <p className="text-xs text-slate-400">{dateStr} · {timeStr}</p>
                    </div>
                    <StatusBadge status={app.status as any} />
                  </div>
                </Link>
              );
            }) : (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-400">
                No upcoming appointments.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#0F172A] mb-6">This Week&apos;s Activity</h2>
        <div className="flex items-end gap-3 h-32">
          {dayCounts.map((count, i) => {
            const heightPct = Math.round((count / maxCount) * 100);
            const isToday = i === now.getDay();
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-slate-400">{count > 0 ? count : ""}</span>
                <div className="w-full rounded-t-lg transition-all" style={{
                  height: `${Math.max(heightPct, 4)}%`,
                  backgroundColor: isToday ? "#7C6FCD" : count > 0 ? "#EDE9FF" : "#F1F5F9",
                  minHeight: "8px"
                }} />
                <span className={`text-xs font-medium ${isToday ? "text-[#7C6FCD]" : "text-slate-400"}`}>{dayLabels[i]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
