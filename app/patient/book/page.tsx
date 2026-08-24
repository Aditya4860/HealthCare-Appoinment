"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar as CalIcon, Clock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DoctorData = any;

const SPECIALISATIONS = ["All", "Cardiology", "Dermatology", "General Practice", "Orthopedics", "Neurology"];

export default function BookAppointmentPage() {
  const router = useRouter();
  
  // Wizard State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Data State
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [specFilter, setSpecFilter] = useState("All");
  
  // Selection State
  const [selectedDoc, setSelectedDoc] = useState<DoctorData | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [onLeave, setOnLeave] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  
  // Symptoms & Hold
  const [symptoms, setSymptoms] = useState("");
  const [holding, setHolding] = useState(false);
  const [holdError, setHoldError] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  
  // Confirm
  const [confirming, setConfirming] = useState(false);
  
  // Timer State (Step 4)
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  // Fetch Doctors
  useEffect(() => {
    async function fetchDocs() {
      setLoadingDocs(true);
      try {
        const res = await fetch(`/api/patient/doctors?specialisation=${specFilter}`);
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors);
        }
      } finally {
        setLoadingDocs(false);
      }
    }
    fetchDocs();
  }, [specFilter]);

  // Fetch Slots
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDoc || !selectedDate) return;
      setLoadingSlots(true);
      setOnLeave(false);
      setSelectedTime("");
      try {
        const res = await fetch(`/api/patient/doctors/${selectedDoc.id}/slots?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
          setOnLeave(data.onLeave || false);
        }
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [selectedDoc, selectedDate]);

  // Timer logic for Step 4
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 4 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && step === 4) {
      // Expired
      router.push("/patient/dashboard");
    }
    return () => clearInterval(timer);
  }, [step, timeLeft, router]);

  const handleHold = async () => {
    if (symptoms.length < 20) return;
    setHolding(true);
    setHoldError("");
    try {
      const res = await fetch("/api/patient/appointments/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoc.id,
          date: selectedDate,
          time: selectedTime
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setHoldError(data.error || "Failed to hold slot");
        return;
      }
      setAppointmentId(data.appointment.id);
      setTimeLeft(15 * 60);
      setStep(4);
    } catch (e) {
      setHoldError("Network error. Try again.");
    } finally {
      setHolding(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`/api/patient/appointments/${appointmentId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms })
      });
      if (res.ok) {
        router.push(`/patient/appointments/${appointmentId}`);
      } else {
        alert("Failed to confirm booking.");
      }
    } finally {
      setConfirming(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName="Patient" role="PATIENT" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-10 relative">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-border -z-10" />
          <div className="absolute top-4 left-0 h-0.5 bg-brand transition-all duration-300" style={{ width: `${(step - 1) * 33.33}%` }} />
          
          <div className="flex justify-between">
            {["Doctor", "Date & Slot", "Symptoms", "Confirm"].map((label, idx) => {
              const num = idx + 1;
              const isCompleted = num < step;
              const isCurrent = num === step;
              const isUpcoming = num > step;
              
              let circleClass = "bg-gray-100 text-slate-500 border-2 border-transparent";
              if (isCompleted) circleClass = "bg-brand text-white border-2 border-brand";
              if (isCurrent) circleClass = "bg-white text-brand border-2 border-brand";

              return (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${circleClass} shadow-sm transition-all`}>
                    {isCompleted ? <CheckCircle2 size={16} /> : num}
                  </div>
                  <span className={`text-xs font-medium font-inter ${isCurrent ? 'text-brand' : 'text-slate-500'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="font-sora text-2xl font-bold text-brand mb-6">Find a Doctor</h1>
            
            <div className="flex overflow-x-auto gap-2 pb-4 mb-6 hide-scrollbar">
              {SPECIALISATIONS.map(spec => (
                <button
                  key={spec}
                  onClick={() => setSpecFilter(spec)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium font-inter transition-colors ${
                    specFilter === spec ? "bg-brand text-white shadow-md" : "bg-brand-light text-brand hover:bg-brand/10"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>

            {loadingDocs ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand" size={32} /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map(doc => {
                  const sp = doc.doctorProfile?.specialisation || "General";
                  const duration = doc.doctorProfile?.slotDuration || 30;
                  let wh = { start: "", end: "" };
                  try { wh = JSON.parse(doc.doctorProfile?.workingHours || "{}") } catch {}
                  
                  return (
                    <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                         onClick={() => { setSelectedDoc(doc); setStep(2); }}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {doc.name?.substring(0,2).toUpperCase() || "DR"}
                        </div>
                        <div>
                          <h3 className="font-semibold font-inter text-slate-800">{doc.name}</h3>
                          <span className="inline-block bg-brand-light text-brand text-xs px-2 py-0.5 rounded-full font-inter font-medium mt-1 mb-2">
                            {sp}
                          </span>
                          <p className="text-xs text-slate-500 font-inter">
                            {duration} min slots &middot; {wh.start} - {wh.end}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center border-t border-slate-200 pt-4">
                        <div className="flex items-center gap-1.5">
                           {/* Naive mock indicator */}
                           <span className="w-2 h-2 rounded-full bg-accent"></span>
                           <span className="text-xs text-slate-600 font-inter">Available today</span>
                        </div>
                        <Button size="sm" className="bg-brand hover:bg-brand/90 text-white rounded-xl text-xs h-8 px-4">
                          Select
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && selectedDoc && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand font-inter mb-4">
              <ArrowLeft size={16} /> Back to doctors
            </button>
            <h1 className="font-sora text-2xl font-bold text-slate-800 mb-6">Choose a date and time</h1>
            
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                {selectedDoc.name?.substring(0,2).toUpperCase() || "DR"}
              </div>
              <div>
                <p className="font-medium font-inter text-sm text-slate-800">{selectedDoc.name}</p>
                <p className="text-xs text-slate-500 font-inter">{selectedDoc.doctorProfile?.specialisation}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">Select a date</label>
              <Input type="date" min={todayStr} value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                     className="max-w-xs h-11 rounded-xl focus-visible:ring-brand mb-6" />

              {selectedDate && (
                <div>
                  <p className="text-sm text-slate-500 font-inter mb-4">Available slots for {new Date(selectedDate).toLocaleDateString()}</p>
                  
                  {loadingSlots ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {[...Array(12)].map((_, i) => <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-xl" />)}
                    </div>
                  ) : onLeave ? (
                    <div className="bg-warn/10 text-warn-700 p-4 rounded-xl text-sm font-inter border border-warn/20">
                      Doctor is on leave this day. Please choose another date.
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-sm text-slate-500 font-inter italic">No slots available on this date.</div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {slots.map(time => {
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`text-sm font-medium px-3 py-2 rounded-xl transition-all duration-150 font-inter ${
                              isSelected 
                                ? "bg-brand text-white scale-105 shadow-md ring-2 ring-brand/30" 
                                : "bg-brand-light text-brand border border-brand/20 hover:bg-brand hover:text-white hover:scale-105 hover:shadow-md"
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setStep(3)} disabled={!selectedTime} className="bg-brand hover:bg-brand/90 text-white rounded-xl px-8 h-11 text-base">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && selectedDoc && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <button onClick={() => setStep(2)} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand font-inter mb-4">
              <ArrowLeft size={16} /> Back to slots
            </button>
            <h1 className="font-sora text-2xl font-bold text-slate-800 mb-6">What brings you in?</h1>
            
            <div className="bg-brand-light rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-brand/10">
              <div className="flex items-center gap-3">
                <CalIcon className="text-brand" size={20} />
                <div className="font-inter text-sm text-brand">
                  <span className="font-semibold">{selectedDoc.name}</span> &middot; {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-brand hover:bg-brand/10 h-8">
                Edit
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">Describe your symptoms</label>
              <Textarea 
                placeholder="e.g. I've been experiencing chest pain for 3 days, especially when breathing deeply..."
                rows={5}
                value={symptoms}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSymptoms(e.target.value)}
                className="rounded-xl border-slate-200 focus-visible:ring-brand resize-none font-inter"
              />
              <div className="flex justify-between mt-2">
                <p className="text-xs text-slate-500 italic font-inter">
                  This helps your doctor prepare before your visit. An AI summary will be generated for them.
                </p>
                <span className={`text-xs font-inter ${symptoms.length < 20 ? 'text-danger' : 'text-slate-500'}`}>
                  {symptoms.length} / 500
                </span>
              </div>
              
              {holdError && (
                <div className="mt-4 bg-danger/10 text-danger border border-danger/20 p-3 rounded-xl text-sm font-inter">
                  {holdError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleHold} disabled={holding || symptoms.length < 20} className="bg-brand hover:bg-brand/90 text-white rounded-xl px-8 h-11 text-base">
                {holding ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Hold this slot
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && selectedDoc && (
          <div className="animate-in fade-in zoom-in-95 duration-500 max-w-lg mx-auto text-center pt-8">
            <h1 className="font-sora text-3xl font-bold text-slate-800 mb-2">Review & Confirm</h1>
            <p className="text-sm text-slate-500 font-inter mb-8">Please confirm your appointment details below.</p>
            
            <div className="mb-8 flex flex-col items-center">
              <p className="text-sm font-medium text-slate-600 mb-2 font-inter">Your slot is held for</p>
              <div className={`font-sora text-4xl font-bold tabular-nums transition-colors duration-300 ${timeLeft < 60 ? 'text-danger animate-pulse' : 'text-brand'}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-slate-500 font-inter mt-2">Complete booking before it expires</p>
            </div>

            <div className="bg-brand-light rounded-2xl p-6 text-left border border-brand/10 mb-8">
              <h2 className="text-sm font-medium text-brand mb-4 font-inter">Your appointment details</h2>
              
              <div className="space-y-3 font-inter text-sm">
                <div className="flex justify-between border-b border-brand/10 pb-2">
                  <span className="text-slate-500">Doctor</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.name}</span>
                </div>
                <div className="flex justify-between border-b border-brand/10 pb-2">
                  <span className="text-slate-500">Specialisation</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.doctorProfile?.specialisation}</span>
                </div>
                <div className="flex justify-between border-b border-brand/10 pb-2">
                  <span className="text-slate-500">Date</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time</span>
                  <span className="font-semibold text-slate-800">{selectedTime}</span>
                </div>
              </div>
            </div>

            <Button onClick={handleConfirm} disabled={confirming || timeLeft === 0} className="w-full bg-brand hover:bg-brand/90 text-white rounded-xl h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all font-inter">
              {confirming ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Generating AI summary...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </div>
        )}

      </main>
    </div>
  );
}
