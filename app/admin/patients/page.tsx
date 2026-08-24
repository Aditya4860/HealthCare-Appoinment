"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2, Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatIST } from "@/lib/timezone";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PatientData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  createdAt: string;
  appointmentCount: number;
  lastAppointment: { scheduledAt: string } | null;
  activeMedications: number;
  isActive: boolean;
};

export default function AdminPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [confirmingDeactivate, setConfirmingDeactivate] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPatients = () => {
    setLoading(true);
    fetch("/api/admin/patients")
      .then((r) => r.json())
      .then((d) => {
        setPatients(d.patients || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDeactivate = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/patients/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Patient account deactivated");
        setPatients(patients.map(p => p.id === id ? { ...p, isActive: false } : p));
      } else {
        toast.error("Failed to deactivate account");
      }
    } finally {
      setActionLoading(null);
      setConfirmingDeactivate(null);
    }
  };

  const handleReactivate = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/patients/${id}/reactivate`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Patient account reactivated");
        setPatients(patients.map(p => p.id === id ? { ...p, isActive: true } : p));
      } else {
        toast.error("Failed to reactivate account");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = patients.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                          p.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" ? true :
                          statusFilter === "Active" ? p.isActive :
                          !p.isActive;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout role="ADMIN" userName="Admin" pageTitle="Patient Management">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1B3A6B]">Patient Management</h1>
          <span className="bg-[#EDE9FF] text-[#7C6FCD] rounded-full px-3 py-1 text-sm font-medium">
            {patients.length} total
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name or email..."
              className="pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#7C6FCD] focus:ring-2 focus:ring-[#7C6FCD]/10 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="py-2.5 px-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#7C6FCD]"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-[#7C6FCD]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No patients found</p>
            <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Health Info</th>
                  <th className="px-4 py-3">Appointments</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* PATIENT */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EDE9FF] text-[#7C6FCD] flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {patient.name?.substring(0, 2).toUpperCase() || "PT"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{patient.name}</p>
                          <p className="text-xs text-slate-400">{patient.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* CONTACT */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-slate-700">{patient.phone || '—'}</p>
                        <p className="text-xs text-slate-400">{patient.gender || 'Not specified'}</p>
                      </div>
                    </td>

                    {/* HEALTH INFO */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-slate-700">
                          {patient.bloodGroup ? 
                            <span className="bg-red-50 text-red-600 rounded px-1.5 py-0.5 text-xs font-medium">
                              {patient.bloodGroup}
                            </span> 
                            : '—'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5" title={patient.allergies || ""}>
                          {patient.allergies ? `⚠ ${patient.allergies.split(',')[0]}...` : 'No allergies'}
                        </p>
                      </div>
                    </td>

                    {/* APPOINTMENTS */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {patient.appointmentCount} total
                        </p>
                        <p className="text-xs text-slate-400">
                          {patient.lastAppointment ? 
                            `Last: ${formatIST(new Date(patient.lastAppointment.scheduledAt), "MMM d, yyyy")}` 
                            : 'No visits yet'}
                        </p>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3">
                      {patient.isActive ? 
                        <span className="bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 text-xs font-medium">Active</span>
                        :
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 rounded-full px-2.5 py-0.5 text-xs font-medium">Inactive</span>
                      }
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 text-right">
                      {confirmingDeactivate === patient.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-slate-600">Deactivate?</span>
                          <button 
                            onClick={() => handleDeactivate(patient.id)} 
                            disabled={actionLoading === patient.id}
                            className="text-xs bg-red-500 text-white rounded-lg px-3 py-1.5 flex items-center justify-center min-w-[50px]"
                          >
                            {actionLoading === patient.id ? <Loader2 size={12} className="animate-spin" /> : "Yes"}
                          </button>
                          <button 
                            onClick={() => setConfirmingDeactivate(null)}
                            disabled={actionLoading === patient.id}
                            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => router.push(`/admin/patients/${patient.id}`)}
                            className="text-xs border border-slate-200 hover:border-[#7C6FCD] hover:text-[#7C6FCD] rounded-lg px-3 py-1.5 transition-colors"
                          >
                            Edit Profile
                          </button>
                          {patient.isActive ? (
                            <button 
                              onClick={() => setConfirmingDeactivate(patient.id)}
                              className="text-xs border border-red-200 text-red-500 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleReactivate(patient.id)}
                              disabled={actionLoading === patient.id}
                              className="text-xs border border-green-200 text-green-600 hover:bg-green-50 rounded-lg px-3 py-1.5 transition-colors flex items-center min-w-[80px] justify-center"
                            >
                              {actionLoading === patient.id ? <Loader2 size={12} className="animate-spin" /> : "Reactivate"}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="border-t border-slate-200 p-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
