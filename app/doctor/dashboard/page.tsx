'use client'

import { Navbar } from "@/components/Navbar";

export default function DoctorDashboard() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar userName="Doctor" role="DOCTOR" />
      <div className="content-wrapper py-8">
        <h1 className="text-2xl font-bold mb-2">Welcome Doctor</h1>
        <p className="text-gray-600">Your schedule overview is ready.</p>
      </div>
    </div>
  )
}
