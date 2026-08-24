import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin Dashboard — MediBook",
};

export default async function AdminDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "ADMIN") redirect("/login");

  // Fetch actual stats
  const totalDoctors = await prisma.user.count({ where: { role: "DOCTOR" } });
  const totalPatients = await prisma.user.count({ where: { role: "PATIENT" } });
  
  // Appointments today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const appointmentsToday = await prisma.appointment.count({
    where: {
      scheduledAt: {
        gte: startOfDay,
        lt: endOfDay,
      }
    }
  });

  // Cancelled this week (Assuming last 7 days)
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const cancelledThisWeek = await prisma.appointment.count({
    where: {
      status: "CANCELLED",
      updatedAt: { gte: startOfWeek }
    }
  });

  // Fetch some doctors to display on dashboard
  const recentDoctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    include: { doctorProfile: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName={session.name || session.email} role="ADMIN" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold font-sora text-brand mb-6">
          Admin Dashboard
        </h1>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Doctors", value: totalDoctors },
            { label: "Today's Appointments", value: appointmentsToday },
            { label: "Active Patients", value: totalPatients },
            { label: "Cancelled This Week", value: cancelledThisWeek },
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

        {/* Doctors Section */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
          <h2 className="text-xl font-bold font-sora text-slate-800">Recent Doctors</h2>
          <Link href="/admin/doctors">
            <Button variant="outline" className="text-brand border-brand/20 hover:bg-brand hover:text-white transition-colors">
              Manage All Doctors
            </Button>
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
          {recentDoctors.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-inter">No doctors found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDoctors.map(doc => {
                const initials = doc.name?.substring(0,2).toUpperCase() || "DR";
                return (
                  <div key={doc.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand/5 text-brand rounded-full flex items-center justify-center font-bold font-sora text-lg border border-brand/10">
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 font-inter text-base">{doc.name}</p>
                        <p className="text-sm text-slate-500 font-inter mt-0.5">
                          <span className="font-medium text-brand">{doc.doctorProfile?.specialisation || "General"}</span> &middot; {doc.email}
                        </p>
                      </div>
                    </div>
                    <Link href={`/admin/doctors/${doc.id}`}>
                      <Button variant="ghost" className="text-brand hover:bg-brand/10 font-medium font-inter">
                        Edit Profile
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
