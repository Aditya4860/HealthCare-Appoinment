import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, ChevronRight, Clock, PlusCircle, Pill } from "lucide-react";
import { formatIST, getCurrentISTDate } from "@/lib/timezone";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Patient Dashboard — MediBook" };

export default async function PatientDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "PATIENT") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { calendarToken: true }
  });

  const now = new Date();

  const [upcomingAppointments, completedCount, activeMeds] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        patientId: session.userId,
        scheduledAt: { gte: now },
        status: { notIn: ["CANCELLED", "COMPLETED"] }
      },
      include: { doctor: { include: { doctorProfile: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.appointment.count({
      where: { patientId: session.userId, status: "COMPLETED" }
    }),
    prisma.medicationReminder.count({
      where: { patientId: session.userId, active: true }
    }),
  ]);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <DashboardLayout role="PATIENT" userName={user?.name || user?.email || ""} pageTitle="Dashboard">
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0F172A]">Good day, {firstName} 👋</h2>
        <p className="text-slate-400 text-sm mt-1">{formatIST(getCurrentISTDate(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/patient/appointments" className="group block">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-[#7C6FCD] hover:shadow-md transition-all">
            <p className="text-3xl font-bold text-[#1B3A6B] group-hover:text-[#7C6FCD] transition-colors">{upcomingAppointments.length}</p>
            <p className="text-sm text-slate-500 mt-1">Upcoming</p>
            <span className="text-[#7C6FCD] text-xs opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">View →</span>
          </div>
        </Link>
        <Link href="/patient/appointments?filter=completed" className="group block">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-[#7C6FCD] hover:shadow-md transition-all">
            <p className="text-3xl font-bold text-[#1B3A6B] group-hover:text-[#7C6FCD] transition-colors">{completedCount}</p>
            <p className="text-sm text-slate-500 mt-1">Completed</p>
            <span className="text-[#7C6FCD] text-xs opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">View →</span>
          </div>
        </Link>
        <Link href="/patient/medications" className="group block col-span-2 sm:col-span-1">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-[#7C6FCD] hover:shadow-md transition-all">
            <p className="text-3xl font-bold text-[#1B3A6B] group-hover:text-[#7C6FCD] transition-colors">{activeMeds}</p>
            <p className="text-sm text-slate-500 mt-1">Active Medications</p>
            <span className="text-[#7C6FCD] text-xs opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">View →</span>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming appointments */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#0F172A]">Upcoming Appointments</h2>
            <Link href="/patient/appointments" className="text-xs text-[#7C6FCD] font-medium hover:underline">View all →</Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm flex flex-col items-center text-center">
              <Calendar className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-slate-400 text-sm mb-4">No upcoming appointments</p>
              <Link href="/patient/book">
                <Button className="bg-[#1B3A6B] hover:bg-[#2A5298] text-white rounded-xl">
                  Book your first appointment <ChevronRight size={16} className="ml-1" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((app) => {
                const dateStr = formatIST(app.scheduledAt, "EEE, MMM d");
                const timeStr = formatIST(app.scheduledAt, "hh:mm a 'IST'");
                return (
                  <div key={app.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-[#7C6FCD]/30 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-semibold text-[#1B3A6B]">{dateStr}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={12} /> {timeStr}
                        </p>
                      </div>
                      <StatusBadge status={app.status as any} />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#EDE9FF] text-[#7C6FCD] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {app.doctor.name?.substring(0, 2).toUpperCase() || "DR"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0F172A] text-sm">{app.doctor.name}</h3>
                        <span className="inline-block bg-[#EDE9FF] text-[#7C6FCD] text-xs px-2 py-0.5 rounded-full font-medium mt-0.5">
                          {app.doctor.doctorProfile?.specialisation}
                        </span>
                      </div>
                    </div>
                    {app.urgencyLevel && (
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5 mb-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${app.urgencyLevel === "High" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                          {app.urgencyLevel} Urgency
                        </span>
                        <p className="text-xs text-slate-500">{app.chiefConcern}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <Link href={`/patient/appointments/${app.id}`} className="text-[#7C6FCD] text-xs font-medium hover:underline inline-flex items-center gap-1">
                        View Details <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions sidebar */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[#0F172A]">Quick Actions</h2>

          <Link href="/patient/book" className="block">
            <div className="bg-[#1B3A6B] rounded-2xl p-6 text-white hover:bg-[#2A5298] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer">
              <PlusCircle size={24} className="mb-3" />
              <h3 className="font-bold text-base">Book New Appointment</h3>
              <p className="text-white/60 text-sm mt-1">Find doctors and book a slot</p>
            </div>
          </Link>

          <Link href="/patient/medications" className="block">
            <div className="bg-[#EDE9FF] rounded-2xl p-6 hover:bg-[#E0D9FF] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
              <Pill size={24} className="text-[#7C6FCD] mb-3" />
              <h3 className="font-bold text-base text-[#1B3A6B]">View Medications</h3>
              <p className="text-[#7C6FCD]/60 text-sm mt-1">See your active prescriptions</p>
            </div>
          </Link>

          {/* Calendar connection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-1 flex items-center gap-2">
              <Calendar size={16} className="text-[#7C6FCD]" /> Google Calendar
            </h3>
            <p className="text-xs text-slate-400 mb-3">Sync appointments to your calendar</p>
            {user?.calendarToken ? (
              <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                <CheckCircle size={14} /> Connected
              </div>
            ) : (
              <a href="/api/calendar/auth" className="block">
                <Button variant="outline" className="w-full text-[#7C6FCD] border-[#7C6FCD]/30 hover:bg-[#EDE9FF] text-xs h-9 rounded-xl">
                  Connect Calendar
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
