import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api/require-session";
import { isSupabaseConfigured, getServerFarmId } from "@/lib/supabase/env";
import { deleteReport, loadReports, saveReport } from "@/lib/supabase/reports-persist";
import type { ReportDocument } from "@/types/reports";

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }
  try {
    const items = await loadReports(getServerFarmId());
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/farm/reports GET]", err);
    return NextResponse.json({ error: "Échec chargement." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireSession();
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }
  try {
    const document = (await request.json()) as ReportDocument;
    await saveReport(getServerFarmId(), document);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/farm/reports POST]", err);
    return NextResponse.json({ error: "Échec enregistrement." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requireSession();
  if (denied) return denied;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 503 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }
    await deleteReport(getServerFarmId(), id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/farm/reports DELETE]", err);
    return NextResponse.json({ error: "Échec suppression." }, { status: 500 });
  }
}
