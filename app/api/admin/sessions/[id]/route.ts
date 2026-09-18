import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json({ error: "db_unconfigured" }, { status: 503 });
  }

  const { data, error } = await sb.rpc("analytics_session_detail", {
    p_session: id,
  });

  if (error) {
    console.error("[admin] session detail rpc failed:", error);
    return NextResponse.json(
      { error: "query_failed", detail: `sessions: ${error.message}` },
      { status: 500 },
    );
  }
  if (!data?.session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
