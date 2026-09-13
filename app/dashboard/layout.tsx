"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { IconPlus } from "@/components/Icons";
import Sidebar from "./_components/Sidebar";
import Header from "./_components/Header";

const SIDEBAR_COLLAPSED_KEY = "sunu-sidebar-collapsed";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.must_change_password) {
      router.replace("/change-password");
    }
  }, [loading, user, router]);

  if (loading || !user || user.must_change_password) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell flex h-dvh min-h-0 w-full overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapsed={toggleCollapsed}
      />

      <div className="dashboard-main-col flex min-h-0 min-w-0 flex-1 flex-col">
        <Header onOpenMobile={() => setMobileOpen(true)} />

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 px-4 py-6 sm:px-6 md:px-8 md:py-8 print:overflow-visible print:bg-white print:p-0">
          {children}
        </main>
      </div>

      {/* Bouton flottant mobile : nouvelle facture accessible depuis n'importe quelle page */}
      {pathname !== "/dashboard/factures/new" && (
        <Link
          href="/dashboard/factures/new"
          aria-label="Nouvelle facture"
          className="no-print fixed right-4 bottom-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 md:hidden"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
        >
          <IconPlus className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}
