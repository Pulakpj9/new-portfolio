import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createUserClient } from "@/lib/supabase/server";

/* Verifies the caller's Supabase session for admin API routes.
   Returns the user, or a 401 Response to return directly.
   Data access still uses the service client — this answers WHO, not WHAT. */

export async function requireAdmin(): Promise<User | NextResponse> {
  try {
    const sb = await createUserClient();
    if (!sb) {
      return NextResponse.json({ error: "auth_unconfigured" }, { status: 503 });
    }
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return user;
  } catch {
    return NextResponse.json({ error: "auth_failed" }, { status: 401 });
  }
}
