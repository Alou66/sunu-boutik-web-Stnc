"use client";

import { usePathname } from "next/navigation";
import { IconChevronLeft, IconChevronRight, IconMenu } from "@/components/Icons";
import { navItems } from "./AdminSidebar";

export default function AdminHeader({
  collapsed,
  onToggleCollapsed,
  onOpenMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenMobile: () => void;
}) {
  const pathname = usePathname();
  const activeItem = navItems.find((item) => pathname === item.href);
  const title = activeItem?.label ?? "Administration";

  return (
    <header className="flex shrink-0 items-center gap-3 border-b bg-white px-4 py-3 md:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        className="text-gray-500 hover:text-gray-700 md:hidden"
        aria-label="Ouvrir le menu"
      >
        <IconMenu className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={onToggleCollapsed}
        className="hidden h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 md:flex"
        aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
        title={collapsed ? "Déplier le menu" : "Réduire le menu"}
      >
        {collapsed ? <IconChevronRight className="w-5 h-5" /> : <IconChevronLeft className="w-5 h-5" />}
      </button>

      <h1 className="truncate text-base font-semibold text-gray-900">{title}</h1>
    </header>
  );
}
