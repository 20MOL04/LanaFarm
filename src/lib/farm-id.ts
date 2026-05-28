/**
 * Identifiant ferme — local (dev) ou UUID Supabase (prod).
 * Seed migration 00006 : f47ac10b-58cc-4372-a567-0e02b2c3d479
 */

export const LANAFARM_DEFAULT_FARM_UUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

export function getPublicFarmId(): string {
  const fromEnv = process.env.NEXT_PUBLIC_LANAFARM_FARM_ID?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NEXT_PUBLIC_LANAFARM_DATA_REMOTE === "true") {
    return LANAFARM_DEFAULT_FARM_UUID;
  }
  return "local-farm-v1";
}

export function isFarmDataRemote(): boolean {
  return process.env.NEXT_PUBLIC_LANAFARM_DATA_REMOTE === "true";
}
