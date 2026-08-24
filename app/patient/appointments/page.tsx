"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2, Calendar as CalIcon, Clock } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatIST } from "@/lib/timezone";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppointmentData = any;

export default function AllAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/patient/appointments")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setAppointments(d.appointments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="PATIENT" userName="Patient" pageTitle="My Appointments">
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#7C6FCD]" size={32} />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <p className="text-slate-400 text-sm mb-4">You have no appointment history yet.</p>
          <Link href="/patient/book">
            <Button className="bg-[#1B3A6B] hover:bg-[#2A5298] text-white rounded-xl">Book Appointment</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((app) => {
            const dateStr = formatIST(app.scheduledAt, "EEE, MMM d, yyyy");
            const timeStr = formatIST(app.scheduledAt, "hh:mm a 'IST'");
            return (
              <Link key={app.id} href={`/patient/appointments/${app.id}`} className="block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-[#7C6FCD]/30 hover:shadow-md transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#EDE9FF] text-[#7C6FCD] flex items-center justify-center font-bold text-lg flex-shrink-0 group-hover:bg-[#7C6FCD] group-hover:text-white transition-colors">
                      {app.doctor.name?.substring(0, 2).toUpperCase() || "DR"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0F172A] group-hover:text-[#7C6FCD] transition-colors">{app.doctor.name}</h3>
                      <span className="inline-block bg-[#EDE9FF] text-[#7C6FCD] text-xs px-2 py-0.5 rounded-full font-medium mt-0.5">
                        {app.doctor.doctorProfile?.specialisation}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><CalIcon size={13} /> {dateStr}</span>
                      <span className="flex items-center gap-1"><Clock size={13} /> {timeStr}</span>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
