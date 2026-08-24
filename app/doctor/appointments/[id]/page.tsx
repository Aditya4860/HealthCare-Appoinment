"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Textarea } from "@/components/ui/textarea";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppointmentData = any;

export default function DoctorAppointmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [appointment, setAppointment] = useState<AppointmentData>(null);
  const [loading, setLoading] = useState(true);
  
  // Complete form
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

  useEffect(() => {
    fetchAppointment();
  }, [id, router]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/doctor/appointments/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, prescription })
      });
      if (res.ok) {
        await fetchAppointment();
      } else {
        alert("Failed to complete visit");
      }
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar userName="Doctor" role="DOCTOR" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  const dateStr = new Date(appointment.scheduledAt).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  const timeStr = new Date(appointment.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  let aiQuestionsArr: string[] = [];
  if (appointment.aiQuestions) {
    aiQuestionsArr = appointment.aiQuestions.split("\n").filter((q: string) => q.trim().length > 0);
  }

  let medsArr: any[] = [];
  try {
    // @ts-ignore
    if (appointment.medications) medsArr = JSON.parse(appointment.medications);
  } catch {}

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName="Doctor" role="DOCTOR" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/doctor/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand font-inter mb-6 transition-colors">
          <ArrowLeft size={16} /> Schedule
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT PANEL */}
          <div className="space-y-6">
            
            {/* Patient Info Card */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-2xl flex-shrink-0">
                {appointment.patient.name?.substring(0,2).toUpperCase() || "PT"}
              </div>
              <div>
                <span className="text-xs text-muted font-inter uppercase tracking-wider font-semibold">Patient</span>
                <h1 className="font-sora text-xl font-bold text-slate-800">{appointment.patient.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-600 font-inter">
                  <span>{dateStr} &middot; {timeStr}</span>
                  <StatusBadge status={appointment.status as any} />
                </div>
              </div>
            </div>

            {/* AI Analysis Card */}
            <div className="bg-brand-light rounded-2xl p-5 border border-brand/20 shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-brand/10">
                <h2 className="text-sm font-bold font-sora text-brand">AI Pre-visit Analysis</h2>
                {appointment.urgencyLevel && (
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${appointment.urgencyLevel === "High" ? "bg-danger text-white" : "bg-warn text-white"}`}>
                    {appointment.urgencyLevel} Urgency
                  </span>
                )}
              </div>
              
              {appointment.chiefConcern ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-brand/70 uppercase tracking-wider mb-1 font-inter">Chief concern</h3>
                    <p className="text-base font-medium text-slate-800 font-inter">{appointment.chiefConcern}</p>
                  </div>
                  
                  {aiQuestionsArr.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-brand/70 uppercase tracking-wider mb-2 font-inter">Suggested questions to ask:</h3>
                      <ul className="space-y-3">
                        {aiQuestionsArr.map((q, i) => (
                          <li key={i} className="flex gap-3 items-start">
                            <span className="bg-brand text-white rounded-full w-6 h-6 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                              {i+1}
                            </span>
                            <span className="text-sm text-slate-700 font-inter mt-1">{q.replace(/^\d+\.\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-brand/10">
                    <p className="text-xs text-muted italic font-inter">
                      Generated from patient symptoms &middot; Verify clinically
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted font-inter text-center py-4">AI summary not available</p>
              )}
            </div>

            {/* Patient Symptoms Card */}
            {appointment.symptoms && (
              <div>
                <span className="block text-sm font-medium text-muted mb-2 font-inter">Patient reported symptoms</span>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-slate-700 font-inter border border-slate-100">
                  {appointment.symptoms}
                </div>
              </div>
            )}
            
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-6">
            
            {appointment.status === "CONFIRMED" && (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-lg font-bold font-sora text-slate-800 mb-6">Complete This Visit</h2>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 font-inter">Clinical Notes</label>
                    <Textarea 
                      placeholder="Diagnosis, examination findings, treatment plan..."
                      rows={6}
                      required
                      value={notes}
                      onChange={(e: any) => setNotes(e.target.value)}
                      className="rounded-xl border-border focus-visible:ring-brand resize-none font-inter"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 font-inter">Prescription</label>
                    <Textarea 
                      placeholder="e.g. Amoxicillin 500mg twice daily for 7 days&#10;Paracetamol 500mg as needed"
                      rows={4}
                      value={prescription}
                      onChange={(e: any) => setPrescription(e.target.value)}
                      className="rounded-xl border-border focus-visible:ring-brand resize-none font-inter"
                    />
                    <p className="text-xs text-muted font-inter">
                      Each line = one medication. AI will format into patient instructions.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleComplete} 
                    disabled={completing || !notes.trim()} 
                    className="w-full bg-brand hover:bg-brand/90 text-white rounded-xl h-12 text-base font-inter"
                  >
                    {completing ? (
                      <><Loader2 className="animate-spin mr-2" size={18} /> Generating patient summary...</>
                    ) : "Complete & Generate Summary"}
                  </Button>
                </div>
              </div>
            )}
            
            {appointment.status === "COMPLETED" && (
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="text-accent" size={20} />
                  <h2 className="text-lg font-bold font-sora text-accent">Visit completed</h2>
                </div>
                <p className="text-sm text-muted font-inter mb-6">Post-visit summary generated for patient</p>
                
                <div className="space-y-5">
                  <div>
                    <span className="block text-sm font-medium text-slate-700 mb-2 font-inter">Patient Summary Preview</span>
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-slate-700 font-inter whitespace-pre-wrap border border-slate-100">
                      {appointment.patientSummary}
                    </div>
                  </div>
                  
                  {medsArr.length > 0 && (
                    <div>
                      <span className="block text-sm font-medium text-slate-700 mb-2 font-inter">Medication Schedule</span>
                      <div className="bg-white rounded-xl border border-border overflow-hidden">
                        <table className="w-full text-left font-inter">
                          <thead className="bg-gray-50 border-b border-border text-xs font-medium text-muted uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">Medicine</th>
                              <th className="px-4 py-3">Dose</th>
                              <th className="px-4 py-3">Frequency</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-sm text-slate-800">
                            {medsArr.map((med: any, i: number) => (
                              <tr key={i}>
                                <td className="px-4 py-3 font-medium">{med.medicine}</td>
                                <td className="px-4 py-3">{med.dose}</td>
                                <td className="px-4 py-3 text-muted">{med.frequency}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {appointment.notes && (
                    <div className="pt-4 border-t border-accent/10">
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-inter">Your Private Notes</span>
                      <p className="text-sm text-slate-700 font-inter">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}
