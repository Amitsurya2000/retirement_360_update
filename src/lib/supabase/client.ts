// Browser-side Supabase client (used in client components for sign-in).
import { createBrowserClient } from "@supabase/ssr";

// True only when both env vars are present. Used to hide auth UI / skip gating
// until the project owner has wired up Supabase keys.
export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
