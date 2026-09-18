import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser (client-side) usage.
 * Uses createBrowserClient from @supabase/ssr which handles cookie-based
 * auth state automatically in the browser environment.
 */
export const createSupabaseClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );