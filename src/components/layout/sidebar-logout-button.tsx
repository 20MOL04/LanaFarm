"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  collapsed: boolean;
  email?: string;
};

export function SidebarLogoutButton({ collapsed }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "shrink-0 border-0 bg-sidebar px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2",
        "md:px-2 md:pb-2 md:pt-0"
      )}
    >
      {!collapsed ? (
        <p className="mb-1 px-1 text-sm font-medium text-sidebar-muted md:mb-1.5 md:px-2 md:text-micro">
          Session active
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        title="Se déconnecter"
        aria-label="Se déconnecter"
        className={cn(
          "flex min-h-[2.75rem] w-full items-center gap-3 rounded-md px-3 py-2",
          "text-lg font-semibold leading-tight",
          "md:min-h-0 md:gap-2.5 md:rounded-sm md:px-2 md:py-[0.4375rem] md:text-nav md:font-medium",
          "text-white/90 transition-colors",
          "bg-white/10 hover:bg-white/20 hover:text-white",
          "disabled:opacity-50",
          collapsed && "justify-center md:min-h-0 md:bg-transparent md:hover:bg-sidebar-hover"
        )}
      >
        <LogOut className="h-6 w-6 shrink-0 md:h-4 md:w-4" />
        {!collapsed ? (
          <span>{loading ? "Déconnexion…" : "Se déconnecter"}</span>
        ) : null}
      </button>
    </div>
  );
}
