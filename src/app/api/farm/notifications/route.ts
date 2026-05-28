import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { isSupabaseConfigured, getServerFarmId } from "@/lib/supabase/env";
import {
  loadNotifications,
  patchNotification,
  upsertNotifications,
} from "@/lib/supabase/notifications-persist";
import type { AppNotification } from "@/types/notifications";

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }
  try {
    const items = await loadNotifications(getServerFarmId());
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/farm/notifications GET]", err);
    return NextResponse.json({ error: "Échec chargement." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = await requireSession();
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }
  try {
    const { items } = (await request.json()) as { items: AppNotification[] };
    await upsertNotifications(getServerFarmId(), items ?? []);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/farm/notifications PUT]", err);
    return NextResponse.json({ error: "Échec enregistrement." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const denied = await requireSession();
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }
  try {
    const body = (await request.json()) as {
      id: string;
      readAt?: string;
      dismissedAt?: string;
    };
    const patch: { read_at?: string; dismissed_at?: string } = {};
    if (body.readAt) patch.read_at = body.readAt;
    if (body.dismissedAt) patch.dismissed_at = body.dismissedAt;
    await patchNotification(getServerFarmId(), body.id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/farm/notifications PATCH]", err);
    return NextResponse.json({ error: "Échec mise à jour." }, { status: 500 });
  }
}
