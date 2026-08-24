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
          <h2 className="text-xl font-bold font-sora text-slate-800">Doctors</h2>
          <Link href="/admin/doctors">
            <Button variant="default" className="bg-brand hover:bg-brand/90 text-white">
              Add Doctor
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-slate-500 font-inter">
          Manage your hospital's doctors from the Doctors page.
        </p>

      </main>
    </div>
  );
}
