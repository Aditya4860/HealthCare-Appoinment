"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Loader2, ArrowLeft, Calendar as CalIcon, Clock } from "lucide-react";
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
    async function fetchAppointments() {
      try {
        const res = await fetch("/api/patient/appointments");
        if (res.ok) {
          const data = await res.json();
          setAppointments(data.appointments);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName="Patient" role="PATIENT" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/patient/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand font-inter mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        
        <h1 className="font-sora text-2xl font-bold text-slate-800 mb-8">All Appointments</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand" size={32} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <p className="text-slate-500 font-inter mb-4">You have no appointments history.</p>
            <Link href="/patient/book">
              <Button className="bg-brand hover:bg-brand/90 text-white font-inter rounded-xl">Book Appointment</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((app) => {
              const dateStr = formatIST(app.scheduledAt, "EEE, MMM d, yyyy");
              const timeStr = formatIST(app.scheduledAt, "hh:mm a 'IST'");
              
              return (
                <Link key={app.id} href={`/patient/appointments/${app.id}`} className="block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-brand/30 hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {app.doctor.name?.substring(0,2).toUpperCase() || "DR"}
                      </div>
                      <div>
                        <h3 className="font-semibold font-inter text-slate-800">{app.doctor.name}</h3>
                        <span className="inline-block bg-brand-light text-brand text-xs px-2 py-0.5 rounded-full font-inter font-medium mt-1">
                          {app.doctor.doctorProfile?.specialisation}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="flex items-center gap-3 text-sm text-slate-600 font-inter">
                        <span className="flex items-center gap-1"><CalIcon size={14}/> {dateStr}</span>
                        <span className="flex items-center gap-1"><Clock size={14}/> {timeStr}</span>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  );
}
