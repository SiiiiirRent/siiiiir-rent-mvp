"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import RequireLoueur from "@/components/auth/RequireLoueur";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <RequireLoueur>
      <div className="min-h-screen bg-slate-50">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <div className="flex">
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
          <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>
      </div>
    </RequireLoueur>
  );
}
