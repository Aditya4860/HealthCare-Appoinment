"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Loader2, ArrowLeft, Calendar, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { formatIST } from "@/lib/timezone";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppointmentData = any;

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [appointment, setAppointment] = useState<AppointmentData>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/patient/appointments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAppointment(data.appointment);
      } else {
        router.push("/patient/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [id, router]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/patient/appointments/${id}/cancel`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Appointment cancelled successfully.");
        setIsCancelModalOpen(false);
        fetchAppointment();
      } else {
        toast.error("Failed to cancel appointment.");
      }
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar userName="Patient" role="PATIENT" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  const dateStr = formatIST(appointment.scheduledAt, "EEEE, MMMM d, yyyy");
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
    } catch (e) {
      aiQuestionsArr = appointment.aiQuestions.split("\n").filter((q: string) => q.trim().length > 0);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName="Patient" role="PATIENT" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/patient/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand font-inter mb-6 transition-colors">
          <ArrowLeft size={16} /> My Appointments
        </Link>
        
        {/* Header Card */}
        <div className="bg-brand text-white rounded-2xl p-6 shadow-md mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-sora text-2xl font-bold">{appointment.doctor.name}</h1>
            </div>
            <span className="inline-block bg-white/20 text-white text-xs px-3 py-1 rounded-full font-inter font-medium">
              {appointment.doctor.doctorProfile?.specialisation}
            </span>
          </div>
          <div className="flex flex-col md:items-end gap-2">
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-1.5 font-inter font-medium">
                <Calendar size={18} /> {dateStr}
              </div>
              <div className="flex items-center gap-1.5 font-inter font-medium">
                <Clock size={18} /> {timeStr}
              </div>
            </div>
            {(() => {
              const status = appointment.status;
              let badgeClass = "";
              if (status === "CONFIRMED") badgeClass = "bg-green-400/30 text-white border border-green-300/50 px-3 py-1 rounded-full text-xs font-medium";
              else if (status === "CANCELLED") badgeClass = "bg-red-400/30 text-white border border-red-300/50 px-3 py-1 rounded-full text-xs font-medium";
              else if (status === "COMPLETED") badgeClass = "bg-blue-300/30 text-white border border-blue-200/50 px-3 py-1 rounded-full text-xs font-medium";
              else if (status === "HOLD") badgeClass = "bg-amber-400/30 text-white border border-amber-300/50 px-3 py-1 rounded-full text-xs font-medium";
              else badgeClass = "bg-white/20 text-white border border-white/30 px-3 py-1 rounded-full text-xs font-medium";
              
              const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
              return <span className={badgeClass}>{label}</span>;
            })()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* AI Pre-visit Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold font-sora text-slate-800 mb-4">AI Pre-visit Summary</h2>
              
              {appointment.urgencyLevel ? (
                <div className="space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-sm font-medium text-slate-500 font-inter">AI Analysis</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md font-inter ${appointment.urgencyLevel === "High" ? "bg-danger/10 text-danger" : "bg-warn/10 text-warn-700"}`}>
                      {appointment.urgencyLevel} Urgency
                    </span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-inter">Chief concern:</span>
                    <p className="text-base text-slate-800 font-inter leading-relaxed">{appointment.chiefConcern}</p>
                  </div>
                  
                  {aiQuestionsArr.length > 0 && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-inter">Suggested questions:</span>
                      <ul className="space-y-2 text-sm text-slate-700 font-inter">
                        {aiQuestionsArr.map((q, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-brand font-semibold select-none">{i+1}.</span>
                            <span>{q.replace(/^\d+\.\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <p className="text-xs text-slate-500 italic font-inter flex items-center gap-1.5">
                      <AlertCircle size={14} /> Generated by AI &middot; For doctor reference only
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                  <p className="text-sm text-slate-500 font-inter">AI summary unavailable for this appointment</p>
                </div>
              )}
            </div>

            {/* Visit Summary (Post-appointment) */}
            {appointment.patientSummary && (
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 shadow-sm mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <h3 className="font-semibold text-accent font-sora">Your Visit Summary</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-inter">{appointment.patientSummary}</p>
                
                {/* Medication schedule if available */}
                {appointment.medications && appointment.medications !== "[]" && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-slate-600 mb-3 font-inter">Medication Schedule</h4>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left p-3 text-xs text-slate-500 font-semibold font-inter">Medicine</th>
                            <th className="text-left p-3 text-xs text-slate-500 font-semibold font-inter">Dose</th>
                            <th className="text-left p-3 text-xs text-slate-500 font-semibold font-inter">Frequency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {JSON.parse(appointment.medications).map((med: any, i: number) => (
                            <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                              <td className="p-3 font-medium text-slate-800 font-inter">{med.medicine}</td>
                              <td className="p-3 text-slate-600 font-inter">{med.dose}</td>
                              <td className="p-3 text-slate-600 font-inter">{med.frequency}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Original Prescription Text */}
            {appointment.prescription && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-8">
                <h3 className="text-lg font-bold font-sora text-slate-800 mb-4">Doctor's Prescription</h3>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 font-inter whitespace-pre-wrap border border-slate-100">
                  {appointment.prescription}
                </div>
              </div>
            )}
            
          </div>

          {/* Right column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold font-sora text-slate-800 mb-4">Appointment Info</h3>
              
              {appointment.symptoms && (
                <div className="mb-6">
                  <span className="block text-xs font-semibold text-slate-500 mb-2 font-inter">Your Symptoms</span>
                  <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 font-inter italic border border-slate-100">
                    "{appointment.symptoms}"
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <span className="block text-xs font-semibold text-slate-500 mb-2 font-inter">Current Status</span>
                <StatusBadge status={appointment.status as any} />
              </div>
              
              {appointment.status === "CONFIRMED" && (
                <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                  <DialogTrigger className="w-full border border-danger text-danger hover:bg-danger hover:text-white font-inter rounded-xl transition-colors h-10 inline-flex items-center justify-center text-sm font-medium">
                    Cancel Appointment
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="font-sora text-danger">Cancel Appointment</DialogTitle>
                      <DialogDescription className="font-inter">
                        Are you sure you want to cancel this appointment with {appointment.doctor.name}? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                      <DialogClose className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 font-inter">
                        Keep it
                      </DialogClose>
                      <Button variant="destructive" onClick={handleCancel} disabled={cancelling} className="font-inter">
                        {cancelling ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                        Yes, cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
