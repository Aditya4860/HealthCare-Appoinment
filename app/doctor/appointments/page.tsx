import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatIST } from "@/lib/timezone";

export const metadata = { title: "Appointments — MediBook" };

export default async function DoctorAppointmentsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "DOCTOR") redirect("/login");

  const filter = searchParams.filter || "all";

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  let whereClause: any = { doctorId: session.userId };
  let pageTitle = "All Appointments";

  if (filter === "today") {
    whereClause.scheduledAt = { gte: startOfDay, lt: endOfDay };
    whereClause.status = { not: "CANCELLED" };
    pageTitle = "Today's Appointments";
  } else if (filter === "week") {
    whereClause.scheduledAt = { gte: startOfWeek };
    whereClause.status = { not: "CANCELLED" };
    pageTitle = "This Week's Appointments";
  } else if (filter === "completed") {
    whereClause.status = "COMPLETED";
    pageTitle = "Completed Appointments";
  }

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: { patient: true },
    orderBy: { scheduledAt: filter === "completed" ? "desc" : "asc" },
  });

  const FILTERS = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "completed", label: "Completed" },
    { key: "all", label: "All" },
  ];

  const URGENCY_STYLE: Record<string, string> = {
    High: "bg-red-100 text-red-600",
    Medium: "bg-amber-100 text-amber-600",
    Low: "bg-green-100 text-green-600",
  };

  return (
    <DashboardLayout role="DOCTOR" userName={session.name || "Doctor"} pageTitle="Patients & Appointments">
      {/* Filter tabs */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <Link key={f.key} href={`/doctor/appointments?filter=${f.key}`}>
              <span className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all ${
                filter === f.key
                  ? "bg-[#1B3A6B] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
                {f.label}
              </span>
            </Link>
          ))}
        </div>
        <span className="text-sm text-slate-400">{appointments.length} appointment{appointments.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {appointments.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <p className="text-sm">No appointments found for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Patient</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Date & Time</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest hidden md:table-cell">Concern</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Urgency</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {appointments.map((app, i) => {
                  const dateStr = formatIST(app.scheduledAt, "EEE, MMM d, yyyy");
                  const timeStr = formatIST(app.scheduledAt, "hh:mm a");
                  return (
                    <tr key={app.id} className={`hover:bg-[#EDE9FF]/10 transition-colors ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#EDE9FF] text-[#7C6FCD] flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {app.patient.name?.substring(0, 2).toUpperCase() || "PT"}
                          </div>
                          <div>
                            <p className="font-semibold text-[#0F172A]">{app.patient.name}</p>
                            <p className="text-xs text-slate-400">{app.patient.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        <p>{dateStr}</p>
                        <p className="text-xs text-slate-400">{timeStr}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs hidden md:table-cell">
                        <p className="truncate text-xs">{app.chiefConcern || "—"}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        {app.urgencyLevel ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${URGENCY_STYLE[app.urgencyLevel] || "bg-slate-100 text-slate-500"}`}>
                            {app.urgencyLevel}
                          </span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={app.status as any} />
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/doctor/appointments/${app.id}`}>
                          <span className="text-[#7C6FCD] font-medium text-xs border border-[#7C6FCD]/30 px-3 py-1.5 rounded-lg hover:bg-[#EDE9FF] transition-colors whitespace-nowrap">
                            View Details
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
