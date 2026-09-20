import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }

    let supabaseResponse: NextResponse = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
          },
        },
      }
    );

    // Look up the auth email from the username
    const { data: authEmail, error: lookupError } = await supabase
      .rpc("lookup_auth_email_by_username", { p_username: username.trim() });

    if (lookupError) {
      console.error("[forgot-password] Username lookup error:", lookupError.code, lookupError.message);
      return NextResponse.json(
        { error: "Unable to process request. Please try again." },
        { status: 500 }
      );
    }

    if (!authEmail) {
      // Always return success to avoid username enumeration
      return NextResponse.json(
        { success: true, message: "If an account with that username exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    // Send the password reset email using the resolved auth email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(authEmail);

    if (resetError) {
      console.error("[forgot-password] Reset email error:", resetError.code, resetError.message);
      // Still return success to avoid leaking information
    }

    return NextResponse.json(
      { success: true, message: "If an account with that username exists, a reset link has been sent." },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[forgot-password] Unexpected error:", message);
    if (process.env.NODE_ENV === "development") {
      throw err;
    }
    return NextResponse.json(
      { error: "Unable to process request. Please try again." },
      { status: 500 }
    );
  }
}
