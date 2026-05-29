"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { textCaptionClass, textNavClass } from "@/lib/typography-tokens";

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
        "shrink-0 border-0 bg-sidebar p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        "md:pb-2"
      )}
    >
      {!collapsed ? (
        <p className={cn("mb-1.5 px-2 text-sidebar-muted", textCaptionClass)}>
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
          "flex w-full items-center gap-2 rounded-sm px-2",
          textNavClass,
          "min-h-11 md:min-h-0 md:py-1.5",
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
