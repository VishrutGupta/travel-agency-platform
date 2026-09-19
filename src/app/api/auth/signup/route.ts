import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required." },
        { status: 400 }
      );
    }

    const { supabase } = await createSupabaseServerClient(request);

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
      console.error("[signup] Auth error:", signUpError.code, signUpError.message, signUpError.status);
      return NextResponse.json(
        { error: signUpError.message || "Failed to create account." },
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
    // This bypasses RLS and handles agency lookup automatically
    const { error: rpcError } = await supabase.rpc("create_owner_profile", {
      user_email: email,
      target_agency_slug: "alpine-expeditions",
      owner_name: fullName,
    });

    if (rpcError) {
      console.error("[signup] RPC error:", rpcError.code, rpcError.message, rpcError.details, rpcError.hint);
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
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[signup] Unexpected error:", message);
    return NextResponse.json(
      { error: "We couldn't create your account. Please try again." },
      { status: 500 }
    );
  }
}
