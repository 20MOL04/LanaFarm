import "server-only";

import { LANAFARM_DEFAULT_FARM_UUID } from "@/lib/farm-id";

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL manquant.");
  }
  return url;
}

export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant (serveur uniquement).");
  }
  return key;
}

export function getServerFarmId(): string {
  return (
    process.env.LANAFARM_FARM_ID?.trim() ||
    process.env.NEXT_PUBLIC_LANAFARM_FARM_ID?.trim() ||
    LANAFARM_DEFAULT_FARM_UUID
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}
