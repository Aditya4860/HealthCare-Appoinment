"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2, Pill, Clock } from "lucide-react";
import { formatIST } from "@/lib/timezone";

type MedData = any;

export default function PatientMedicationsPage() {
  const [medications, setMedications] = useState<MedData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/patient/medications")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setMedications(d.medications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="PATIENT" userName="Patient" pageTitle="My Medications">
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#7C6FCD]" size={32} />
        </div>
      ) : medications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <Pill size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No medication reminders yet.</p>
          <p className="text-slate-300 text-xs mt-1">Medications are added by your doctor after a completed visit.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medications.map((med: MedData) => {
            const isActive = med.active;
            const createdStr = formatIST(new Date(med.createdAt), "MMM d, yyyy");
            const nextStr = med.nextReminderAt
              ? formatIST(new Date(med.nextReminderAt), "MMM d, yyyy · hh:mm a")
              : null;
            return (
              <div key={med.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-[#7C6FCD]/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#EDE9FF] text-[#7C6FCD] flex items-center justify-center flex-shrink-0">
                      <Pill size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0F172A] text-base">{med.medicine}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{med.dose}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isActive ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"
                  }`}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frequency</span>
                    <span className="font-medium text-[#0F172A]">{med.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Prescribed</span>
                    <span className="font-medium text-[#0F172A]">{createdStr}</span>
                  </div>
                  {nextStr && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1"><Clock size={12} /> Next reminder</span>
                      <span className="font-medium text-[#7C6FCD] text-xs">{nextStr}</span>
                    </div>
                  )}
                </div>

                {med.appointment?.doctor && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-6 h-6 rounded-full bg-[#EDE9FF] text-[#7C6FCD] flex items-center justify-center font-bold text-[10px]">
                      {med.appointment.doctor.name?.substring(0, 2).toUpperCase() || "DR"}
                    </div>
                    From: <span className="font-medium text-slate-500">{med.appointment.doctor.name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
