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
    <div className="shrink-0 border-t border-sidebar-border p-2">
      {!collapsed ? (
        <p className="mb-1.5 px-2 text-[10px] text-sidebar-muted">Session active</p>
      ) : null}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        title="Se déconnecter"
        className={cn(
          "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-[12px]",
          "text-sidebar-muted transition-colors",
          "hover:bg-sidebar-hover hover:text-white",
          "disabled:opacity-50",
          collapsed && "justify-center"
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
