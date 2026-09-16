import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function createSupabaseServerClient(
  request: NextRequest
) {
  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies[name];
          return value || undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies[name] = value;
          response.cookies[name] = value;
          // Note: cannot set cookie options here as they are not passed through
        },
        remove(name: string, options: CookieOptions) {
          request.cookies[name] = "";
          response.cookies[name] = "";
        },
      },
    }
  );

  return { supabase, response };
}