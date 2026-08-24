"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DoctorData = any;

export default function DoctorDetailPage() {
  const { id } = useParams();
  
  const [doctor, setDoctor] = useState<DoctorData>(null);
  const [loading, setLoading] = useState(true);
  
  // Profile Form
  const [specialisation, setSpecialisation] = useState("");
  const [slotDuration, setSlotDuration] = useState(30);
  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Leave Form
  const [leaveDate, setLeaveDate] = useState("");
  const [addingLeave, setAddingLeave] = useState(false);
  const [cancelledCount, setCancelledCount] = useState<number | null>(null);

  const fetchDoctor = async () => {
    try {
      const res = await fetch("/api/admin/doctors");
      const data = await res.json();
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = data.doctors.find((d: any) => d.id === id);
        if (doc) {
          setDoctor(doc);
          setSpecialisation(doc.doctorProfile?.specialisation || "");
          setSlotDuration(doc.doctorProfile?.slotDuration || 30);
          try {
            const wh = JSON.parse(doc.doctorProfile?.workingHours || "{}");
            setWorkStart(wh.start || "");
            setWorkEnd(wh.end || "");
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    
    try {
      const res = await fetch(`/api/admin/doctors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialisation,
          slotDuration,
          workingHours: { start: workStart, end: workEnd }
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Doctor profile updated successfully.");
      await fetchDoctor();
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDate) return;
    setAddingLeave(true);
    setCancelledCount(null);

    try {
      const res = await fetch(`/api/admin/doctors/${id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: leaveDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.appointmentsCancelled > 0) {
        setCancelledCount(data.appointmentsCancelled);
      } else {
        toast.info("Leave added. No existing appointments were affected.");
      }
      
      setLeaveDate("");
      await fetchDoctor();
    } catch (err: unknown) {
      let msg = "Error adding leave.";
      if (err instanceof Error) msg = err.message;
      toast.error(msg);
    } finally {
      setAddingLeave(false);
    }
  };

  const handleDeleteLeave = async (dateStr: string) => {
    if (!confirm("Remove this leave day?")) return;
    try {
      const formattedDate = new Date(dateStr).toISOString().split('T')[0];
      const res = await fetch(`/api/admin/doctors/${id}/leave/${formattedDate}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchDoctor();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar userName="Admin" role="ADMIN" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName="Admin" role="ADMIN" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin/doctors" className="inline-flex items-center gap-2 text-muted hover:text-slate-800 transition-colors mb-6 text-sm font-inter">
          <ArrowLeft size={16} /> Back to Doctors
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-sora text-slate-800">{doctor.name}</h1>
          <p className="text-muted font-inter mt-1">{doctor.email}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Doctor Profile (col-span-2) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6 shadow-sm h-fit">
            <h2 className="text-xl font-bold font-sora text-slate-800 mb-6">Doctor Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              
              <div className="space-y-2">
                <Label className="font-inter">Specialisation</Label>
                <Input type="text" required value={specialisation} onChange={e => setSpecialisation(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label className="font-inter">Slot Duration (minutes)</Label>
                <Input type="number" required value={slotDuration} onChange={e => setSlotDuration(parseInt(e.target.value))} min={5}/>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-inter">Working Hours Start</Label>
                  <Input type="time" required value={workStart} onChange={e => setWorkStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Working Hours End</Label>
                  <Input type="time" required value={workEnd} onChange={e => setWorkEnd(e.target.value)} />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={savingProfile} className="bg-brand hover:bg-brand/90 text-white font-inter">
                  {savingProfile ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Leave Management (col-span-1) */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-border p-6 shadow-sm h-fit flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold font-sora text-slate-800 mb-2">Leave Management</h2>
              <p className="text-sm text-muted font-inter">
                Mark dates when this doctor is unavailable. Existing bookings will be cancelled.
              </p>
            </div>
            
            {cancelledCount !== null && (
              <div className="bg-warn/10 text-warn-900 border border-warn/20 p-3 rounded-lg text-sm font-inter">
                ⚠ {cancelledCount} appointment(s) were cancelled and patients have been notified.
              </div>
            )}

            <form onSubmit={handleAddLeave} className="space-y-4">
              <div className="space-y-2">
                <Input type="date" required value={leaveDate} onChange={e => setLeaveDate(e.target.value)} min={new Date().toISOString().split('T')[0]}/>
              </div>
              <Button type="submit" disabled={addingLeave} className="w-full bg-brand hover:bg-brand/90 text-white font-inter">
                {addingLeave ? <Loader2 size={16} className="animate-spin" /> : "Add Leave Day"}
              </Button>
            </form>
            
            <div className="mt-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 font-inter">Scheduled Leaves</h3>
              {doctor.doctorProfile?.leaves?.length === 0 ? (
                <p className="text-sm text-muted font-inter italic">No leave days scheduled.</p>
              ) : (
                <ul className="space-y-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {doctor.doctorProfile?.leaves?.map((leave: any) => {
                    const dateObj = new Date(leave.date);
                    const dateStr = dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                    return (
                      <li key={leave.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 font-inter text-sm">
                        <span className="font-medium text-slate-700">{dateStr}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLeave(leave.date)} className="text-danger hover:text-danger hover:bg-danger/10 px-2 h-8">
                          Remove
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
