import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, ChevronRight, Clock, Info } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Patient Dashboard — MediBook" };

export default async function PatientDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "PATIENT") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });

  const now = new Date();
  
  // Fetch upcoming appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: session.userId,
      scheduledAt: { gte: now },
      status: { not: "CANCELLED" }
    },
    include: {
      doctor: { include: { doctorProfile: true } }
    },
    orderBy: { scheduledAt: "asc" }
  });

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName={user?.name || user?.email || ""} role="PATIENT" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-sora text-brand">
            Good morning, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-sm text-slate-500 font-inter mt-1">{todayStr}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column: Upcoming Appointments */}
          <div className="lg:w-2/3">
            <h2 className="text-lg font-bold font-sora text-slate-800 mb-4">Upcoming Appointments</h2>
            
            {appointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm flex flex-col items-center justify-center text-center">
                <Calendar className="w-16 h-16 text-brand/30 mb-4" />
                <p className="text-base text-slate-500 font-inter mb-6">No upcoming appointments</p>
                <Link href="/patient/book">
                  <Button className="bg-brand hover:bg-brand/90 text-white font-inter rounded-xl">
                    Book your first appointment <ChevronRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((app) => {
                  const dateStr = app.scheduledAt.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
                  const timeStr = app.scheduledAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                  
                  return (
                    <div key={app.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-brand/30 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-semibold text-brand font-inter">{dateStr}</p>
                          <p className="text-sm text-slate-500 font-inter flex items-center gap-1 mt-0.5">
                            <Clock size={14} /> {timeStr}
                          </p>
                        </div>
                        <StatusBadge status={app.status as any} />
                      </div>
                      
                      <div className="mb-3">
                        <h3 className="font-semibold font-inter text-slate-800">
                          Dr. {app.doctor.name}
                        </h3>
                        <span className="inline-block bg-brand-light text-brand text-xs px-2 py-0.5 rounded-full font-inter font-medium mt-1">
                          {app.doctor.doctorProfile?.specialisation}
                        </span>
                      </div>
                      
                      {app.urgencyLevel && (
                        <div className="flex items-start gap-2 bg-slate-50 rounded-lg p-2.5 mb-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 ${app.urgencyLevel === "High" ? "bg-danger/10 text-danger" : "bg-warn/10 text-warn-700"}`}>
                            {app.urgencyLevel} Urgency
                          </span>
                          <p className="text-xs text-slate-600 font-inter line-clamp-1">{app.chiefConcern}</p>
                        </div>
                      )}
                      
                      <div className="mt-2 text-right">
                        <Link href={`/patient/appointments/${app.id}`} className="text-brand text-sm font-medium hover:underline font-inter inline-flex items-center gap-1">
                          View Details <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right column: Quick Actions */}
          <div className="lg:w-1/3 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold font-sora text-slate-800 mb-4">Quick Actions</h2>
              
              <div className="flex flex-col gap-3">
                <Link href="/patient/book" className="w-full">
                  <Button className="w-full bg-brand hover:bg-brand/90 text-white font-inter h-11 rounded-xl">
                    Book Appointment
                  </Button>
                </Link>
                <Link href="/patient/appointments" className="w-full">
                  <Button variant="outline" className="w-full border-slate-200 text-slate-700 font-inter h-11 rounded-xl">
                    View All Appointments
                  </Button>
                </Link>
              </div>

              <hr className="my-6 border-slate-200" />
              
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <Calendar size={16} /> Connect Google Calendar
                </h3>
                <p className="text-xs text-slate-500 mb-3 font-inter">Sync appointments to your calendar</p>
                <Button variant="ghost" className="w-full text-brand bg-brand/5 hover:bg-brand/10 font-inter text-sm h-10 rounded-xl justify-center">
                  Connect Calendar
                </Button>
              </div>
            </div>
            
            <div className="bg-brand-light rounded-2xl p-5 border border-brand/10 flex items-start gap-3">
              <Info className="text-brand flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-brand font-inter mb-1">Need help?</h4>
                <p className="text-xs text-brand/80 font-inter">Contact support if you need to reschedule within 24 hours of your appointment.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
