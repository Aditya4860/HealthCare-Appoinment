import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { generateSlots } from "@/lib/booking";

export const metadata = { title: "Doctor Dashboard — MediBook" };

export default async function DoctorDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "DOCTOR") redirect("/login");

  const doctor = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { doctorProfile: true }
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

  // Stats
  const todayCount = await prisma.appointment.count({
    where: { doctorId: session.userId, scheduledAt: { gte: startOfDay, lt: endOfDay }, status: { not: "CANCELLED" } }
  });
  
  const weekCount = await prisma.appointment.count({
    where: { doctorId: session.userId, scheduledAt: { gte: startOfWeek }, status: { not: "CANCELLED" } }
  });
  
  const completedCount = await prisma.appointment.count({
    where: { doctorId: session.userId, status: "COMPLETED" }
  });

  // Appointments Today
  const appointmentsToday = await prisma.appointment.findMany({
    where: {
      doctorId: session.userId,
      scheduledAt: { gte: startOfDay, lt: endOfDay },
      status: { not: "CANCELLED" }
    },
    include: { patient: true },
    orderBy: { scheduledAt: "asc" }
  });

  // Upcoming (after today)
  const upcoming = await prisma.appointment.findMany({
    where: {
      doctorId: session.userId,
      scheduledAt: { gte: endOfDay },
      status: { not: "CANCELLED" }
    },
    include: { patient: true },
    orderBy: { scheduledAt: "asc" },
    take: 10
  });

  let wh = { start: "09:00", end: "17:00" };
  try { wh = JSON.parse(doctor.doctorProfile.workingHours); } catch {}
  
  const allSlots = generateSlots(wh, doctor.doctorProfile.slotDuration);

  // Map slots to appointments
  const timeline = allSlots.map(time => {
    const matchingApp = appointmentsToday.find(a => {
      const t = `${a.scheduledAt.getHours().toString().padStart(2, "0")}:${a.scheduledAt.getMinutes().toString().padStart(2, "0")}`;
      return t === time;
    });
    return { time, appointment: matchingApp };
  });

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName={doctor.name?.split(" ")[0] || "Doctor"} role="DOCTOR" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-sora text-brand mb-8">
          {doctor.name?.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}'s Schedule
        </h1>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Today", value: todayCount },
            { label: "This Week", value: weekCount },
            { label: "Completed", value: completedCount },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-3xl font-semibold font-sora text-brand mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500 font-inter">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold font-sora text-slate-800 mb-6">Today's Schedule</h2>
            
            {appointmentsToday.length > 0 ? (
              <div className="space-y-4">
                {timeline.map((slot, i) => (
                  <div key={i} className="flex">
                    <div className="w-16 text-right pr-4 pt-4 text-sm text-slate-500 font-inter font-medium flex-shrink-0">
                      {slot.time}
                    </div>
                    <div className="flex-1 pb-4">
                      {slot.appointment ? (
                        <div className="bg-white rounded-xl border-l-4 border-l-brand border border-slate-200 shadow-sm p-4 ml-4 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold font-inter text-slate-800">{slot.appointment.patient.name}</span>
                            <StatusBadge status={slot.appointment.status as any} />
                          </div>
                          
                          {slot.appointment.urgencyLevel && (
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${slot.appointment.urgencyLevel === "High" ? "bg-danger/10 text-danger" : "bg-warn/10 text-warn-700"}`}>
                                {slot.appointment.urgencyLevel}
                              </span>
                              <span className="text-sm text-slate-500 font-inter">{slot.appointment.chiefConcern}</span>
                            </div>
                          )}
                          
                          <div className="mt-3">
                            <Link href={`/doctor/appointments/${slot.appointment.id}`} className="text-brand text-sm font-medium hover:underline font-inter">
                              View & Complete &rarr;
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-200 rounded-xl ml-4 p-3 text-xs text-slate-500 font-inter flex items-center justify-center h-full bg-slate-50/50">
                          Available
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
                <p className="text-slate-500 font-inter">You have no appointments today.</p>
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold font-sora text-slate-800 mb-6">Upcoming</h2>
            <div className="space-y-3">
              {upcoming.length > 0 ? (
                upcoming.map(app => {
                  const dateStr = app.scheduledAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  const timeStr = app.scheduledAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <Link key={app.id} href={`/doctor/appointments/${app.id}`} className="block bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-brand/30 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold font-inter text-slate-800 text-sm">{app.patient.name}</span>
                        <StatusBadge status={app.status as any} />
                      </div>
                      <div className="text-xs text-slate-500 font-inter">
                        {dateStr} &middot; {timeStr}
                      </div>
                    </Link>
                  )
                })
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500 font-inter">
                  No upcoming appointments.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
