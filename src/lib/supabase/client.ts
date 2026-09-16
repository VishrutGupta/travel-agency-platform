import { createClient } from "@supabase/ssr";
import { type NextjsRequest } from "@supabase/ssr";

// Create a single supabase client configured to work with nextjs
export const createSupabaseClient = (request: NextjsRequest) =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      // Global config optional
    }
  );