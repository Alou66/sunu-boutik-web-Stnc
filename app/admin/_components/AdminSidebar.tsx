"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChart, IconInbox, IconLogout, IconUsers, IconX } from "@/components/Icons";
import { LogoMark } from "@/components/Logo";

export const navItems = [
  { href: "/admin", label: "Tableau de bord", Icon: IconChart },
  { href: "/admin/demandes", label: "Demandes", Icon: IconInbox },
  { href: "/admin/clients", label: "Mes Clients", Icon: IconUsers },
];

export default function AdminSidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onLogout,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-hidden bg-gray-900 text-gray-300 transition-transform duration-200 ease-in-out md:static md:z-auto md:translate-x-0 md:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-[76px]" : "md:w-60"}`}
        aria-label="Navigation administration"
      >
        <div className="flex items-center justify-between gap-2 border-b border-gray-800 px-4 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <LogoMark className="w-7 h-7 shrink-0" />
            <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <p className="truncate font-bold text-white">Sunu Boutik</p>
              <p className="truncate text-xs text-gray-500">Administration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="text-gray-400 hover:text-white md:hidden"
            aria-label="Fermer le menu"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium ${
                  collapsed ? "md:justify-center md:px-0" : ""
                } ${
                  active
                    ? "border-r-2 border-blue-500 bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.Icon className="w-[18px] h-[18px] shrink-0" />
                <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 px-4 py-4">
          <button
            type="button"
            onClick={onLogout}
            title="Déconnexion"
            aria-label="Déconnexion"
            className={`flex items-center gap-2 text-sm text-gray-400 hover:text-white ${
              collapsed ? "md:justify-center" : ""
            }`}
          >
            <IconLogout className="w-[18px] h-[18px] shrink-0" />
            <span className={collapsed ? "md:hidden" : ""}>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
