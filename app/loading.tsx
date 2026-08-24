import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#1B3A6B]" />
        <p className="text-sm font-medium text-slate-500 font-inter animate-pulse">Loading MediBook...</p>
      </div>
    </div>
  );
}
