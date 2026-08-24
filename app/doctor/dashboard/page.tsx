import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { CalendarCheck, Clock, Users } from "lucide-react";

export const metadata = {
  title: "Doctor Dashboard — MediBook",
};

export default async function DoctorDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "DOCTOR") redirect("/login");

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName={session.name || session.email} role="DOCTOR" />

      <main className="content-wrapper py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-1">
            Good morning, Dr. {session.name?.split(" ").pop() ?? "Doctor"} 👋
          </h1>
          <p className="text-muted text-sm">
            Here&apos;s your schedule overview for today.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Today's appointments",
              value: "0",
              icon: <CalendarCheck size={20} className="text-brand" />,
              iconBg: "bg-brand-light",
            },
            {
              label: "Completed today",
              value: "0",
              icon: <Clock size={20} className="text-accent" />,
              iconBg: "bg-accent/10",
            },
            {
              label: "Total patients",
              value: "0",
              icon: <Users size={20} className="text-warn" />,
              iconBg: "bg-warn/10",
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
          <CalendarCheck size={40} className="text-brand/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            No appointments scheduled
          </h2>
          <p className="text-sm text-muted">
            Your upcoming appointment schedule will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
