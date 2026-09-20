/* Browser Supabase client (anon key, RLS-enforced). Used only for auth
   flows (login/logout) — data access stays in server routes. */

"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
