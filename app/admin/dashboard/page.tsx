import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Users, Stethoscope, CalendarCheck, Shield } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard — MediBook",
};

export default async function AdminDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "ADMIN") redirect("/login");

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName={session.name || session.email} role="ADMIN" />

      <main className="content-wrapper py-8">
        {/* Welcome */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-brand" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Admin Dashboard
            </h1>
            <p className="text-muted text-sm">
              Signed in as {session.name ?? session.email}
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total users",
              value: "3",
              icon: <Users size={20} className="text-brand" />,
              iconBg: "bg-brand-light",
            },
            {
              label: "Doctors",
              value: "1",
              icon: <Stethoscope size={20} className="text-warn" />,
              iconBg: "bg-warn/10",
            },
            {
              label: "Patients",
              value: "1",
              icon: <Users size={20} className="text-accent" />,
              iconBg: "bg-accent/10",
            },
            {
              label: "Appointments",
              value: "0",
              icon: <CalendarCheck size={20} className="text-muted" />,
              iconBg: "bg-slate-100",
            },
          ].map((card) => (
            <div key={card.label} className="card flex items-center gap-4">
              <div
                className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {card.value}
                </p>
                <p className="text-xs text-muted">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder */}
        <div className="card text-center py-12">
          <Shield size={40} className="text-brand/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            System ready
          </h2>
          <p className="text-sm text-muted">
            User management, doctor onboarding, and appointment monitoring will
            appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
