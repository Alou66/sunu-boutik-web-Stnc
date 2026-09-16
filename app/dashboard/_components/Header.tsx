"use client";

import { IconMenu } from "@/components/Icons";
import { useAuth } from "@/lib/auth-context";
import { ROLE_OWNER } from "@/lib/api";

export default function Header({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { user, shop } = useAuth();
  const isOwner = user?.role === ROLE_OWNER;

  return (
    <header className="no-print flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 md:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        className="text-gray-500 hover:text-gray-700 md:hidden"
        aria-label="Ouvrir le menu"
      >
        <IconMenu className="w-6 h-6" />
      </button>

      <div className="ml-auto min-w-0 text-right leading-tight">
        <p className="truncate text-sm font-semibold text-blue-700">{shop?.name}</p>
        <div className="flex items-center justify-end gap-1.5">
          <p className="truncate text-xs text-gray-500">{user?.full_name}</p>
          {user && (
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                isOwner ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {isOwner ? "Administrateur" : "Employé"}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
