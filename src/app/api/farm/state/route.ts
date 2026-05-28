import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { isSupabaseConfigured, getServerFarmId } from "@/lib/supabase/env";
import { loadFarmState, saveFarmState } from "@/lib/supabase/farm-state";
import type { FarmStatePayload } from "@/lib/supabase/farm-mappers";

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase non configuré sur le serveur." },
      { status: 503 }
    );
  }

  try {
    const farmId = getServerFarmId();
    const state = await loadFarmState(farmId);
    return NextResponse.json({ farmId, ...state });
  } catch (err) {
    console.error("[api/farm/state GET]", err);
    return NextResponse.json({ error: "Échec chargement données." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = await requireSession();
  if (denied) return denied;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase non configuré sur le serveur." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as FarmStatePayload;
    const farmId = getServerFarmId();
    await saveFarmState(farmId, body);
    return NextResponse.json({ ok: true, farmId });
  } catch (err) {
    console.error("[api/farm/state PUT]", err);
    return NextResponse.json({ error: "Échec enregistrement données." }, { status: 500 });
  }
}
