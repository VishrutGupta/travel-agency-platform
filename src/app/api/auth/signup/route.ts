import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required." },
        { status: 400 }
      );
    }

    // Create Supabase server client manually to control error handling
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

    // Check if an owner already exists (server-side enforcement)
    const { count: ownerCount, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner");

    if (countError) {
      console.error("[signup] Owner check error:", countError.code, countError.message);
      return NextResponse.json(
        { error: "Unable to verify account status. Please try again." },
        { status: 500 }
      );
    }

    if (ownerCount && ownerCount > 0) {
      return NextResponse.json(
        { error: "An owner account already exists. Please sign in." },
        { status: 403 }
      );
    }

    // Create the Supabase Auth user (server-side)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      console.error("[signup] Auth error code:", signUpError.code);
      console.error("[signup] Auth error message:", signUpError.message);
      console.error("[signup] Auth error status:", signUpError.status);
    }

    if (signUpError) {
      const errorCode = signUpError.code || "";

      if (errorCode === "over_email_send_rate_limit") {
        return NextResponse.json(
          { error: "over_email_send_rate_limit", message: "Too many verification emails have been requested. Please wait a while and try again." },
          { status: 429 }
        );
      }

      if (errorCode === "over_request_rate_limit") {
        return NextResponse.json(
          { error: "over_request_rate_limit", message: "Too many requests were made. Please wait a few minutes and try again." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: errorCode || signUpError.message || "Failed to create account." },
        { status: signUpError.status || 400 }
      );
    }

    if (!signUpData.user) {
      return NextResponse.json(
        { error: "Sign up failed - no user returned." },
        { status: 500 }
      );
    }

    // Create the owner profile using the SECURITY DEFINER RPC function
    const { error: rpcError } = await supabase.rpc("create_owner_profile", {
      user_email: email,
      target_agency_slug: "alpine-expeditions",
      owner_name: fullName,
    });

    if (rpcError) {
      console.error("[signup] RPC error code:", rpcError.code);
      console.error("[signup] RPC error message:", rpcError.message);
      return NextResponse.json(
        { error: "Failed to create profile. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, user: signUpData.user, requiresEmailConfirmation: !signUpData.session },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[signup] Unexpected error:", message);
    // Re-throw in development to see the full stack trace
    if (process.env.NODE_ENV === "development") {
      throw err;
    }
    return NextResponse.json(
      { error: "Account creation failed. Please try again." },
      { status: 500 }
    );
  }
}
