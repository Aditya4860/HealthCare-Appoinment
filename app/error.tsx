"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold font-sora text-slate-800 mb-2">Something went wrong!</h2>
        <p className="text-sm text-slate-500 font-inter mb-8">
          We encountered an unexpected error. Please try again or contact support if the issue persists.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={reset} className="w-full bg-[#1B3A6B] hover:bg-[#2A5298] text-white rounded-xl h-11">
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full rounded-xl h-11">
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
