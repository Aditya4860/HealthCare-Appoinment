"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatIST } from "@/lib/timezone";

type AppointmentData = any;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const URGENCY_STYLE: Record<string, string> = {
  High: "bg-red-100 text-red-600",
  Medium: "bg-amber-100 text-amber-600",
  Low: "bg-green-100 text-green-600",
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/appointments?filter=${filter}`)
      .then((r) => r.json())
      .then((d) => setAppointments(d.appointments || []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <DashboardLayout role="ADMIN" userName="Admin" pageTitle="All Appointments">
      {/* Filter tabs */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all ${
                filter === f.key
                  ? "bg-[#1B3A6B] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-400">{appointments.length} appointment{appointments.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-[#7C6FCD]" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No appointments found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Patient", "Doctor", "Specialisation", "Date & Time", "Urgency", "Status"].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {appointments.map((app, i) => (
                  <tr key={app.id} className={`hover:bg-[#EDE9FF]/10 transition-colors ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {app.patient?.name?.substring(0, 2).toUpperCase() || "PT"}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0F172A]">{app.patient?.name}</p>
                          <p className="text-xs text-slate-400">{app.patient?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#0F172A]">{app.doctor?.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#EDE9FF] text-[#7C6FCD] text-xs font-semibold px-2.5 py-1 rounded-full">
                        {app.doctor?.doctorProfile?.specialisation || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      <p>{formatIST(new Date(app.scheduledAt), "EEE, MMM d, yyyy")}</p>
                      <p className="text-xs text-slate-400">{formatIST(new Date(app.scheduledAt), "hh:mm a")}</p>
                    </td>
                    <td className="px-6 py-4">
                      {app.urgencyLevel ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${URGENCY_STYLE[app.urgencyLevel] || "bg-slate-100 text-slate-500"}`}>
                          {app.urgencyLevel}
                        </span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status as any} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
