"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminApi, clearAdminToken, getAdminToken } from "@/lib/api";
import AdminSidebar from "./_components/AdminSidebar";
import AdminHeader from "./_components/AdminHeader";

const ADMIN_SIDEBAR_COLLAPSED_KEY = "sunu-admin-sidebar-collapsed";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // Pages accessibles sans jeton admin, comme /admin/login : le mot de passe
  // oublié doit rester utilisable par un admin qui n'a justement plus de session.
  const isPublicPage = pathname === "/admin/login" || pathname === "/admin/forgot-password";

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }

  useEffect(() => {
    if (isPublicPage) {
      setChecked(true);
      return;
    }
    if (!getAdminToken()) {
      router.replace("/admin/login");
      return;
    }
    adminApi
      .get("/admin/overview")
      .then(() => setChecked(true))
      .catch(() => {
        clearAdminToken();
        router.replace("/admin/login");
      });
  }, [isPublicPage, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function logout() {
    clearAdminToken();
    router.push("/admin/login");
  }

  if (isPublicPage) return <>{children}</>;

  if (!checked) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden admin-shell">
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={logout}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col admin-main-col">
        <AdminHeader collapsed={collapsed} onToggleCollapsed={toggleCollapsed} onOpenMobile={() => setMobileOpen(true)} />

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
