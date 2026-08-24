import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { formatIST } from "@/lib/timezone";

export const metadata = { title: "Admin Dashboard — MediBook" };

export default async function AdminDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "ADMIN") redirect("/login");

  const totalDoctors = await prisma.user.count({ where: { role: "DOCTOR" } });
  const totalPatients = await prisma.user.count({ where: { role: "PATIENT" } });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const [appointmentsToday, cancelledThisWeek] = await Promise.all([
    prisma.appointment.count({ where: { scheduledAt: { gte: startOfDay, lt: endOfDay } } }),
    prisma.appointment.count({ where: { status: "CANCELLED", updatedAt: { gte: startOfWeek } } }),
  ]);

  const recentDoctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    include: { doctorProfile: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const recentAppointments = await prisma.appointment.findMany({
    include: {
      patient: true,
      doctor: { include: { doctorProfile: true } },
    },
    orderBy: { scheduledAt: "desc" },
    take: 10,
  });

  const stats = [
    { label: "Total Doctors", value: totalDoctors, href: "/admin/doctors", color: "text-[#1B3A6B]", bg: "bg-[#EDE9FF]" },
    { label: "Today's Appointments", value: appointmentsToday, href: "/admin/appointments", color: "text-green-600", bg: "bg-green-50" },
    { label: "Active Patients", value: totalPatients, href: "/admin/patients", color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Cancelled This Week", value: cancelledThisWeek, href: "/admin/appointments?filter=cancelled", color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <DashboardLayout role="ADMIN" userName={session.name || session.email || "Admin"} pageTitle="Dashboard">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group block">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-[#7C6FCD] hover:shadow-md transition-all cursor-pointer">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
              </div>
              <p className="text-2xl font-bold text-[#0F172A] group-hover:text-[#7C6FCD] transition-colors">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              <span className="text-[#7C6FCD] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">View →</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Doctors */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#0F172A]">Recent Doctors</h2>
            <Link href="/admin/doctors">
              <Button variant="outline" size="sm" className="text-[#1B3A6B] border-[#1B3A6B]/20 hover:bg-[#EDE9FF] text-xs rounded-lg">
                Manage All
              </Button>
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {recentDoctors.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No doctors found.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentDoctors.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-[#EDE9FF] text-[#7C6FCD] rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {doc.name?.substring(0, 2).toUpperCase() || "DR"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0F172A] text-sm">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs bg-[#EDE9FF] text-[#7C6FCD] px-2 py-0.5 rounded-full font-medium">
                          {doc.doctorProfile?.specialisation || "General"}
                        </span>
                        <span className="text-xs text-slate-400">{doc.email}</span>
                      </div>
                    </div>
                    <Link href={`/admin/doctors/${doc.id}`}>
                      <Button variant="ghost" size="sm" className="text-[#7C6FCD] hover:bg-[#EDE9FF] text-xs rounded-lg">
                        Edit
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Appointments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#0F172A]">Recent Appointments</h2>
            <Link href="/admin/appointments">
              <Button variant="outline" size="sm" className="text-[#1B3A6B] border-[#1B3A6B]/20 hover:bg-[#EDE9FF] text-xs rounded-lg">
                View All
              </Button>
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {recentAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No appointments found.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentAppointments.slice(0, 6).map((app) => (
                  <div key={app.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#0F172A] text-sm truncate">{app.patient.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dr. {app.doctor.name} · {formatIST(app.scheduledAt, "MMM d, hh:mm a")}
                      </p>
                    </div>
                    <StatusBadge status={app.status as any} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
