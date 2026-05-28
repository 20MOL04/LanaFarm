/**
 * Client navigateur — V1 : données métier via `/api/farm/*` (service_role serveur).
 * Ce client reste disponible pour une future V2 (Supabase Auth + RLS anon).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
