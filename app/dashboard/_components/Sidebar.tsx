"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ROLE_OWNER } from "@/lib/api";
import { LogoMark } from "@/components/Logo";
import {
  IconBadge,
  IconBox,
  IconCash,
  IconChart,
  IconChevronLeft,
  IconChevronRight,
  IconNote,
  IconReceipt,
  IconTag,
  IconUsers,
  IconUser,
  IconPlus,
  IconSwap,
  IconTruck,
  IconBuilding,
  IconLogout,
  IconX,
} from "@/components/Icons";

// Statistiques et Employés sont réservés au propriétaire (owner) de la
// boutique : un employee n'a pas accès aux infos globales de la boutique ni
// au pilotage de l'équipe (voir aussi app/dashboard/layout.tsx pour le
// blocage des URLs directes, et le backend qui refuse ces routes
// indépendamment du menu).
// Profil reste accessible à tous : chaque utilisateur (owner ou employee) y
// gère ses propres informations personnelles ; seul l'owner y voit en plus
// la section "Informations de la boutique" (voir ProfilPage).
export const navItems = [
  { href: "/dashboard/categories", label: "Catégories", Icon: IconTag },
  { href: "/dashboard/articles", label: "Articles", Icon: IconBox },
  { href: "/dashboard/approvisionnements", label: "Approvisionnements", Icon: IconTruck },
  { href: "/dashboard/fournisseurs", label: "Fournisseurs", Icon: IconBuilding },
  { href: "/dashboard/transformations", label: "Transformations", Icon: IconSwap },
  { href: "/dashboard/clients", label: "Clients", Icon: IconUsers },
  { href: "/dashboard/factures", label: "Factures", Icon: IconReceipt },
  { href: "/dashboard/caisse", label: "Caisse", Icon: IconCash },
  { href: "/dashboard/statistiques", label: "Statistiques", Icon: IconChart, ownerOnly: true },
  { href: "/dashboard/bons-clients", label: "Bons clients", Icon: IconNote },
  { href: "/dashboard/employes", label: "Employés", Icon: IconBadge, ownerOnly: true },
  { href: "/dashboard/profil", label: "Profil", Icon: IconUser },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isOwner = user?.role === ROLE_OWNER;
  const visibleItems = navItems.filter((item) => !item.ownerOnly || isOwner);

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-hidden border-r border-gray-100 bg-white transition-transform duration-200 ease-in-out md:static md:z-auto md:translate-x-0 md:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-[76px]" : "md:w-60"}`}
        aria-label="Navigation principale"
      >
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-4 md:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <LogoMark className="w-8 h-8 shrink-0" />
            <span className={`truncate font-bold text-blue-700 ${collapsed ? "md:hidden" : ""}`}>
              Sunu Boutik
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="text-gray-400 hover:text-gray-700 md:hidden"
            aria-label="Fermer le menu"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {pathname !== "/dashboard/factures/new" && (
          <div className={`px-4 pt-4 ${collapsed ? "md:px-3" : ""}`}>
            <Link
              href="/dashboard/factures/new"
              onClick={onCloseMobile}
              title="Nouvelle facture"
              aria-label="Nouvelle facture"
              className={`flex items-center justify-center gap-1.5 rounded-md bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 ${
                collapsed ? "md:px-0" : "px-3"
              }`}
            >
              <IconPlus className="w-4 h-4 shrink-0" />
              <span className={collapsed ? "md:hidden" : ""}>Nouvelle facture</span>
            </Link>
          </div>
        )}

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto py-4">
          {visibleItems.map((item) => {
            const active = pathname.startsWith(item.href);
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
                    ? "border-r-2 border-blue-600 bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.Icon className="w-[18px] h-[18px] shrink-0" />
                <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className={`flex items-center gap-2 border-t border-gray-100 px-4 py-4 ${
            collapsed ? "md:flex-col md:gap-3 md:px-2" : "justify-between"
          }`}
        >
          <button
            type="button"
            onClick={logout}
            title="Déconnexion"
            aria-label="Déconnexion"
            className={`flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 ${
              collapsed ? "md:justify-center" : ""
            }`}
          >
            <IconLogout className="w-[18px] h-[18px] shrink-0" />
            <span className={collapsed ? "md:hidden" : ""}>Déconnexion</span>
          </button>

          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 md:flex"
            aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
            title={collapsed ? "Déplier le menu" : "Réduire le menu"}
          >
            {collapsed ? <IconChevronRight className="w-5 h-5" /> : <IconChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  );
}
