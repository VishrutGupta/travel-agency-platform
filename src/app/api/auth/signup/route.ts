import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, username } = await request.json();

    if (!email || !password || !fullName || !username) {
      return NextResponse.json(
        { error: "Email, password, full name, and username are required." },
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

    // Check if username is already taken
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.trim())
      .maybeSingle();

    if (usernameCheckError) {
      console.error("[signup] Username check error:", usernameCheckError.code, usernameCheckError.message);
    }

    if (existingUsername) {
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // Create the Supabase Auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      console.error("[signup] Auth error code:", signUpError.code);
      console.error("[signup] Auth error message:", signUpError.message);
      console.error("[signup] Auth error status:", signUpError.status);

      if (signUpError.code === "over_email_send_rate_limit") {
        return NextResponse.json(
          { error: "over_email_send_rate_limit", message: "Too many verification emails have been requested. Please wait a while and try again." },
          { status: 429 }
        );
      }

      if (signUpError.code === "over_request_rate_limit") {
        return NextResponse.json(
          { error: "over_request_rate_limit", message: "Too many requests were made. Please wait a few minutes and try again." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: signUpError.code || signUpError.message || "Failed to create account." },
        { status: signUpError.status || 400 }
      );
    }

    if (!signUpData.user) {
      return NextResponse.json(
        { error: "Sign up failed - no user returned." },
        { status: 500 }
      );
    }

    // Set the session so auth.uid() works for subsequent operations
    if (signUpData.session) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: signUpData.session.access_token,
        refresh_token: signUpData.session.refresh_token,
      });
      if (setSessionError) {
        console.error("[signup] setSession error:", setSessionError.message);
      }
    }

    // Verify the user is authenticated
    const { data: { user: authUser }, error: getUserError } = await supabase.auth.getUser();
    const profileUserId = authUser?.id || signUpData.user.id;

    if (getUserError) {
      console.error("[signup] getUser error:", getUserError.message);
    }

    // Create the default agency if it doesn't exist
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("*")
      .eq("slug", "alpine-expeditions")
      .single();

    let agencyId: string;

    if (!agencyError && agency) {
      agencyId = agency.id;
    } else {
      // Agency doesn't exist - create it
      const { data: newAgency, error: createAgencyError } = await supabase
        .from("agencies")
        .insert({
          name: "Alpine & Co. Expeditions",
          slug: "alpine-expeditions",
          email: "hello@alpine-expeditions.com",
          whatsapp: "919820045120",
          phone: "+91 98200 45120",
        })
        .select()
        .single();

      if (createAgencyError) {
        console.error("[signup] Agency create error:", createAgencyError.code, createAgencyError.message);
        return NextResponse.json(
          { error: "Unable to set up agency. Please contact support." },
          { status: 500 }
        );
      }
      agencyId = newAgency.id;
    }

    // Create the owner profile with username
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: profileUserId,
        agency_id: agencyId,
        full_name: fullName,
        role: "owner",
        username: username.trim(),
      });

    if (profileError) {
      console.error("[signup] Profile insert error:", profileError.code, profileError.message, profileError.details);
      return NextResponse.json(
        { error: "Unable to create your owner profile. Please try again." },
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
    if (process.env.NODE_ENV === "development") {
      throw err;
    }
    return NextResponse.json(
      { error: "Account creation failed. Please try again." },
      { status: 500 }
    );
  }
}
