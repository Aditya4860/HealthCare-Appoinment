import { Sidebar, SidebarRole } from "@/components/Sidebar";
import { formatIST, getCurrentISTDate } from "@/lib/timezone";

interface DashboardLayoutProps {
  role: SidebarRole;
  userName: string;
  pageTitle: string;
  children: React.ReactNode;
}

export function DashboardLayout({
  role,
  userName,
  pageTitle,
  children,
}: DashboardLayoutProps) {
  const dateStr = formatIST(getCurrentISTDate(), "EEEE, MMM d, yyyy");

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar role={role} userName={userName} />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="md:ml-60">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 mt-14 md:mt-0">
          <h1 className="text-lg font-semibold text-[#0F172A] tracking-tight">
            {pageTitle}
          </h1>
          <span className="text-sm text-slate-500 hidden sm:block">{dateStr}</span>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
