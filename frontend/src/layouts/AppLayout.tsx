import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <Topbar onMenuClick={() => setMobileNavOpen(true)} />
      <main className="md:ml-sidebar-width pt-16 min-h-screen">
        <div className="px-margin-mobile md:px-margin-desktop py-gutter flex flex-col gap-gutter max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
