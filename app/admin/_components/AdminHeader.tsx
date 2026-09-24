"use client";

import { IconMenu } from "@/components/Icons";
import { LogoMark } from "@/components/Logo";

export default function AdminHeader({ onOpenMobile }: { onOpenMobile: () => void }) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b bg-white px-4 py-3 md:hidden">
      <button
        type="button"
        onClick={onOpenMobile}
        className="text-gray-500 hover:text-gray-700"
        aria-label="Ouvrir le menu"
      >
        <IconMenu className="w-6 h-6" />
      </button>

      <div className="flex min-w-0 items-center gap-2">
        <LogoMark className="w-6 h-6 shrink-0" />
        <span className="truncate text-sm font-semibold text-gray-900">Sunu Boutik · Administration</span>
      </div>
    </header>
  );
}
