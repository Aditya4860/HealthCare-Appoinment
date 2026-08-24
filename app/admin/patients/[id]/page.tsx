"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2, Save, Calendar, Pill, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatIST } from "@/lib/timezone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any;

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "PENDING": return "bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-medium";
    case "CONFIRMED": return "bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-medium";
    case "COMPLETED": return "bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 text-xs font-medium";
    case "CANCELLED": return "bg-red-50 text-red-600 border border-red-200 rounded-full px-2.5 py-0.5 text-xs font-medium";
    default: return "bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5 text-xs font-medium";
  }
};

export default function AdminPatientEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [patient, setPatient] = useState<AnyData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    allergies: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/patients/${params.id}`, {
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.patient) {
        setForm({
          name: data.patient.name || '',
          email: data.patient.email || '',
          phone: data.patient.phone || '',
          dateOfBirth: data.patient.dateOfBirth 
            ? new Date(data.patient.dateOfBirth).toISOString().split('T')[0] 
            : '',
          gender: data.patient.gender || '',
          bloodGroup: data.patient.bloodGroup || '',
          allergies: data.patient.allergies || '',
          address: data.patient.address || '',
          emergencyName: data.patient.emergencyName || '',
          emergencyPhone: data.patient.emergencyPhone || '',
          newPassword: '',
          confirmPassword: '',
        });
        setPatient(data.patient);
      }
    })
    .catch(() => toast.error("Failed to load patient"))
    .finally(() => setLoading(false));
  }, [params.id]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (form.newPassword && form.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (form.phone && !/^\+?[\d\s\-()]{7,15}$/.test(form.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/patients/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Patient profile updated successfully");
        setForm(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (e) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (errorField: string) => `w-full px-4 py-2.5 bg-slate-50 border ${errors[errorField] ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:bg-white focus:border-[#7C6FCD] focus:ring-2 focus:ring-[#7C6FCD]/10 text-sm transition-all`;

  if (loading) {
    return (
      <DashboardLayout role="ADMIN" userName="Admin" pageTitle="Edit Patient">
        <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-[#7C6FCD]" /></div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout role="ADMIN" userName="Admin" pageTitle="Edit Patient">
        <div className="py-20 text-center text-slate-500">Patient not found</div>
      </DashboardLayout>
    );
  }

  const appointments = patient.appointments || [];
  const visibleAppointments = showAllAppointments ? appointments : appointments.slice(0, 5);
  const medications = patient.medications || [];

  return (
    <DashboardLayout role="ADMIN" userName="Admin" pageTitle="Edit Patient">
      
      <div className="mb-6">
        <Link href="/admin/patients" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1B3A6B] transition-colors">
          <ArrowLeft size={16} /> Back to Patients
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT COLUMN: FORM */}
        <div className="w-full lg:w-[60%] bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-[#EDE9FF] text-[#7C6FCD] text-2xl font-bold rounded-full flex items-center justify-center flex-shrink-0">
              {patient.name?.substring(0, 2).toUpperCase() || "PT"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1B3A6B]">{patient.name}</h2>
              <p className="text-sm text-slate-500">{patient.email}</p>
              <p className="text-xs text-slate-400 mt-1">Joined {formatIST(new Date(patient.createdAt), "MMM d, yyyy")}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 my-6"></div>

          <div className="space-y-6">
            {/* Basic Info */}
            <section>
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass("name")} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass("email")} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputClass("phone")} />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                    <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className={inputClass("")}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                    <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className={inputClass("")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                    <select value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})} className={inputClass("")}>
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Medical Info */}
            <section>
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-4 mt-6">Medical Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Allergies</label>
                  <textarea rows={2} value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} placeholder="e.g. Penicillin, Peanuts, Dust mites" className={inputClass("")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <textarea rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={inputClass("")} />
                </div>
              </div>
            </section>

            {/* Emergency Contact */}
            <section>
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-4 mt-6">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Name</label>
                  <input type="text" value={form.emergencyName} onChange={e => setForm({...form, emergencyName: e.target.value})} className={inputClass("")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Phone</label>
                  <input type="text" value={form.emergencyPhone} onChange={e => setForm({...form, emergencyPhone: e.target.value})} className={inputClass("")} />
                </div>
              </div>
            </section>

            {/* Account Security */}
            <section>
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-4 mt-6">Account Security</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input type="password" value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} placeholder="Leave blank to keep current password" className={inputClass("newPassword")} />
                  {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                  <input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className={inputClass("confirmPassword")} />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </section>

            <button onClick={handleSave} disabled={saving} className="w-full bg-[#1B3A6B] hover:bg-[#2A5298] disabled:opacity-70 text-white rounded-xl py-3 font-medium transition-colors flex items-center justify-center gap-2 mt-8">
              {saving ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving Changes...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>

          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-[40%] space-y-6">
          
          {/* Card 1: Appointment History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-[#1B3A6B] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#7C6FCD]" /> Appointment History
            </h3>
            
            {appointments.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No appointments yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {visibleAppointments.map((appt: AnyData) => (
                  <div key={appt.id} className="flex items-start justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Dr. {appt.doctor?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatIST(new Date(appt.scheduledAt), "MMM d, yyyy · hh:mm a")}
                      </p>
                    </div>
                    <span className={statusBadgeClass(appt.status)}>
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {appointments.length > 5 && !showAllAppointments && (
              <button 
                onClick={() => setShowAllAppointments(true)}
                className="w-full text-center text-sm text-[#7C6FCD] hover:text-[#1B3A6B] font-medium mt-4 pt-4 border-t border-slate-100 transition-colors"
              >
                View all {appointments.length} appointments
              </button>
            )}
          </div>

          {/* Card 2: Active Medications */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-[#1B3A6B] mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-[#7C6FCD]" /> Medications
            </h3>

            {medications.length === 0 ? (
              <div className="text-center py-6">
                <Pill className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No medications prescribed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {medications.map((med: AnyData) => {
                  const isActive = med.active && new Date(med.nextReminderAt) > new Date();
                  return (
                    <div key={med.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#7C6FCD]"></div>
                      <div className="flex justify-between items-start ml-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{med.medicine}</p>
                          <p className="text-xs text-slate-500 mt-1">{med.dose} · {med.frequency}</p>
                          {med.appointment?.doctor?.name && (
                            <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide">
                              Dr. {med.appointment.doctor.name}
                            </p>
                          )}
                        </div>
                        {isActive ? (
                          <span className="bg-green-50 text-green-700 rounded-full px-2 py-0.5 text-[10px] font-bold">Active</span>
                        ) : (
                          <span className="bg-slate-200 text-slate-500 rounded-full px-2 py-0.5 text-[10px] font-bold">Expired</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
