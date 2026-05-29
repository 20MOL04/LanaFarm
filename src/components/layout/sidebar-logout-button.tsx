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
        "shrink-0 border-0 bg-sidebar p-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]",
        "md:pb-2"
      )}
    >
      {!collapsed ? (
        <p className="mb-1.5 px-2 text-micro font-medium text-sidebar-muted">
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
          "flex w-full items-center gap-2.5 rounded-sm px-2",
          "py-[0.375rem] text-nav font-medium leading-snug",
          "text-white/90 transition-colors",
          "bg-white/10 hover:bg-white/20 hover:text-white",
          "disabled:opacity-50",
          collapsed && "justify-center md:min-h-0 md:bg-transparent md:hover:bg-sidebar-hover"
        )}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {!collapsed ? (
          <span>{loading ? "Déconnexion…" : "Se déconnecter"}</span>
        ) : null}
      </button>
    </div>
  );
}
