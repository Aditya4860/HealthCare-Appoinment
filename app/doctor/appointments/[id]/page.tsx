"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { formatIST } from "@/lib/timezone";
import { Sidebar } from "@/components/Sidebar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppointmentData = any;

export default function DoctorAppointmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [appointment, setAppointment] = useState<AppointmentData>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [completing, setCompleting] = useState(false);

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/doctor/appointments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAppointment(data.appointment);
        setNotes(data.appointment.notes || "");
        // @ts-ignore
        setPrescription(data.appointment.prescription || "");
      } else {
        router.push("/doctor/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointment(); }, [id, router]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/doctor/appointments/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, prescription })
      });
      if (res.ok) await fetchAppointment();
      else alert("Failed to complete visit");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <Sidebar role="DOCTOR" userName="Doctor" />
        <div className="md:ml-60 flex-1 flex items-center justify-center mt-14 md:mt-0">
          <Loader2 size={32} className="animate-spin text-[#7C6FCD]" />
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  const dateStr = formatIST(appointment.scheduledAt, "EEEE, d MMM yyyy");
  const timeStr = formatIST(appointment.scheduledAt, "hh:mm a 'IST'");

  let aiQuestionsArr: string[] = [];
  if (appointment.aiQuestions) {
    try {
      const parsed = JSON.parse(appointment.aiQuestions);
      if (Array.isArray(parsed)) {
        aiQuestionsArr = parsed;
      } else {
        aiQuestionsArr = appointment.aiQuestions.split("\n").filter((q: string) => q.trim().length > 0);
      }
    } catch {
      aiQuestionsArr = appointment.aiQuestions.split("\n").filter((q: string) => q.trim().length > 0);
    }
  }

  let medsArr: any[] = [];
  try {
    if (appointment.medications) medsArr = JSON.parse(appointment.medications);
  } catch {}

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar role="DOCTOR" userName="Doctor" />
      <div className="md:ml-60 mt-14 md:mt-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <Link href="/doctor/appointments" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1B3A6B] transition-colors">
            <ArrowLeft size={16} /> Back to Patients
          </Link>
          <StatusBadge status={appointment.status as any} />
        </header>

        <main className="p-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT PANEL */}
            <div className="space-y-5">
              {/* Patient Info Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-[#EDE9FF] text-[#7C6FCD] flex items-center justify-center font-bold text-2xl flex-shrink-0">
                  {appointment.patient.name?.substring(0, 2).toUpperCase() || "PT"}
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Patient</span>
                  <h1 className="font-bold text-xl text-[#0F172A]">{appointment.patient.name}</h1>
                  <p className="text-sm text-slate-400 mt-0.5">{dateStr} · {timeStr}</p>
                </div>
              </div>

              {/* AI Analysis Card */}
              <div className="bg-gradient-to-br from-[#EDE9FF] to-white rounded-2xl p-5 border border-[#7C6FCD]/20 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#7C6FCD]/10">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#7C6FCD]" />
                    <h2 className="text-sm font-bold text-[#1B3A6B]">AI Pre-visit Analysis</h2>
                  </div>
                  {appointment.urgencyLevel && (
                    <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${
                      appointment.urgencyLevel === "High" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                    }`}>
                      {appointment.urgencyLevel} Urgency
                    </span>
                  )}
                </div>

                {appointment.chiefConcern ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[10px] font-semibold text-[#7C6FCD] uppercase tracking-widest mb-1">Chief Concern</h3>
                      <p className="font-semibold text-[#0F172A]">{appointment.chiefConcern}</p>
                    </div>
                    {aiQuestionsArr.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-semibold text-[#7C6FCD] uppercase tracking-widest mb-3">Suggested Questions</h3>
                        <ul className="space-y-3">
                          {aiQuestionsArr.map((q, i) => (
                            <li key={i} className="flex gap-3 items-start">
                              <span className="bg-[#1B3A6B] text-white rounded-full w-6 h-6 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-sm text-slate-700 mt-0.5">{q.replace(/^\d+\.\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 italic pt-2 border-t border-[#7C6FCD]/10">
                      Generated from patient symptoms · Verify clinically
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">AI summary not available</p>
                )}
              </div>

              {/* Symptoms */}
              {appointment.symptoms && (
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Patient Reported Symptoms</span>
                  <div className="bg-white rounded-xl p-4 text-sm text-slate-700 border border-slate-100">
                    {appointment.symptoms}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT PANEL */}
            <div className="space-y-5">
              {appointment.status === "CONFIRMED" && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-[#0F172A] mb-6">Complete This Visit</h2>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Clinical Notes</label>
                      <Textarea
                        placeholder="Diagnosis, examination findings, treatment plan..."
                        rows={6}
                        required
                        value={notes}
                        onChange={(e: any) => setNotes(e.target.value)}
                        className="rounded-xl border-slate-200 focus-visible:ring-[#7C6FCD] resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Prescription</label>
                      <Textarea
                        placeholder={`e.g. Amoxicillin 500mg twice daily for 7 days\nParacetamol 500mg as needed`}
                        rows={4}
                        value={prescription}
                        onChange={(e: any) => setPrescription(e.target.value)}
                        className="rounded-xl border-slate-200 focus-visible:ring-[#7C6FCD] resize-none"
                      />
                      <p className="text-xs text-slate-400">Each line = one medication. AI will format into patient instructions.</p>
                    </div>
                    <Button
                      onClick={handleComplete}
                      disabled={completing || !notes.trim()}
                      className="w-full bg-[#1B3A6B] hover:bg-[#2A5298] text-white rounded-xl h-12 text-base font-medium"
                    >
                      {completing ? (
                        <><Loader2 className="animate-spin mr-2" size={18} /> Generating patient summary...</>
                      ) : (
                        <><Sparkles size={18} className="mr-2" /> Complete & Generate Summary</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {appointment.status === "COMPLETED" && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="text-green-500" size={20} />
                    <h2 className="text-lg font-bold text-[#0F172A]">Visit Completed</h2>
                  </div>
                  <p className="text-sm text-slate-400 mb-6">Post-visit summary generated for patient</p>
                  <div className="space-y-5">
                    <div>
                      <span className="block text-sm font-medium text-slate-700 mb-2">Patient Summary Preview</span>
                      <div className="bg-[#F8FAFC] rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap border border-slate-100">
                        {appointment.patientSummary}
                      </div>
                    </div>
                    {medsArr.length > 0 && (
                      <div>
                        <span className="block text-sm font-medium text-slate-700 mb-2">Medication Schedule</span>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-400 uppercase tracking-widest">
                              <tr>
                                <th className="px-4 py-3">Medicine</th>
                                <th className="px-4 py-3">Dose</th>
                                <th className="px-4 py-3">Frequency</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm text-slate-800">
                              {medsArr.map((med: any, i: number) => (
                                <tr key={i}>
                                  <td className="px-4 py-3 font-medium">{med.medicine}</td>
                                  <td className="px-4 py-3">{med.dose}</td>
                                  <td className="px-4 py-3 text-slate-400">{med.frequency}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {appointment.notes && (
                      <div className="pt-4 border-t border-slate-100">
                        <span className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Your Private Notes</span>
                        <p className="text-sm text-slate-700">{appointment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
