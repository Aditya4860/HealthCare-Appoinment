"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DoctorData = any;

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    specialisation: "",
    slotDuration: "30",
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/admin/doctors");
      const data = await res.json();
      if (res.ok) setDoctors(data.doctors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        specialisation: formData.specialisation,
        slotDuration: parseInt(formData.slotDuration),
        workingHours: {
          start: formData.workingHoursStart,
          end: formData.workingHoursEnd,
        }
      };

      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create doctor");
        setSaving(false);
        return;
      }

      setIsOpen(false);
      setFormData({
        name: "", email: "", password: "", specialisation: "", slotDuration: "30", workingHoursStart: "09:00", workingHoursEnd: "17:00"
      });
      await fetchDoctors();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const hasUpcomingLeave = (leaves: any[]) => {
    if (!leaves || leaves.length === 0) return null;
    const now = new Date();
    now.setHours(0,0,0,0);
    const upcoming = leaves.filter(l => new Date(l.date) >= now);
    if (upcoming.length > 0) {
      // Sort by closest date
      upcoming.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return new Date(upcoming[0].date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName="Admin" role="ADMIN" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold font-sora text-brand">Doctors</h1>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-brand hover:bg-brand/90 text-white">
              Add Doctor
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-sora text-xl text-brand">Add Doctor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Dr. John Doe"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="doctor@example.com"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input id="password" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Min. 8 characters" minLength={8}/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Specialisation</Label>
                    <Select value={formData.specialisation as string} onValueChange={v => setFormData({...formData, specialisation: v || ""})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Dermatology">Dermatology</SelectItem>
                        <SelectItem value="Neurology">Neurology</SelectItem>
                        <SelectItem value="General Practice">General Practice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Slot Duration</Label>
                    <Select value={formData.slotDuration as string} onValueChange={v => setFormData({...formData, slotDuration: v || ""})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select value={formData.workingHoursStart as string} onValueChange={v => setFormData({...formData, workingHoursStart: v || ""})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Start" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="07:00">07:00</SelectItem>
                        <SelectItem value="08:00">08:00</SelectItem>
                        <SelectItem value="09:00">09:00</SelectItem>
                        <SelectItem value="10:00">10:00</SelectItem>
                        <SelectItem value="11:00">11:00</SelectItem>
                        <SelectItem value="12:00">12:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select value={formData.workingHoursEnd as string} onValueChange={v => setFormData({...formData, workingHoursEnd: v || ""})}>
                      <SelectTrigger>
                        <SelectValue placeholder="End" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="13:00">13:00</SelectItem>
                        <SelectItem value="14:00">14:00</SelectItem>
                        <SelectItem value="15:00">15:00</SelectItem>
                        <SelectItem value="16:00">16:00</SelectItem>
                        <SelectItem value="17:00">17:00</SelectItem>
                        <SelectItem value="18:00">18:00</SelectItem>
                        <SelectItem value="19:00">19:00</SelectItem>
                        <SelectItem value="20:00">20:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && <p className="text-danger text-sm">{error}</p>}
                
                <div className="pt-2">
                  <Button type="submit" disabled={saving} className="w-full bg-brand hover:bg-brand/90 text-white">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Doctor"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-brand" /></div>
        ) : (
          <div className="space-y-4">
            {doctors.map(doc => {
              const profile = doc.doctorProfile;
              let workingHours = { start: "", end: "" };
              try { workingHours = JSON.parse(profile?.workingHours || "{}"); } catch {}
              
              const leaveStr = hasUpcomingLeave(profile?.leaves);
              const initials = doc.name?.substring(0,2).toUpperCase() || "DR";

              return (
                <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-brand/30 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Avatar circle */}
                    <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center flex-shrink-0 text-lg font-semibold font-inter">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base font-inter text-slate-800">{doc.name}</h3>
                        <span className="bg-brand-light text-brand text-xs px-2 py-0.5 rounded-full font-inter font-medium">
                          {profile?.specialisation || "General"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-inter">
                        Slots: {profile?.slotDuration} min &middot; {workingHours.start}&ndash;{workingHours.end}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto">
                    {leaveStr && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-warn font-inter">
                        <span className="w-2 h-2 rounded-full bg-warn inline-block"></span>
                        On leave {leaveStr}
                      </div>
                    )}
                    <Link href={`/admin/doctors/${doc.id}`}>
                      <Button variant="ghost" className="text-brand hover:text-brand hover:bg-brand/5">
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
            
            {doctors.length === 0 && !isOpen && (
              <div className="py-16 text-center text-slate-500 font-inter">
                <p>No doctors found in the system.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
