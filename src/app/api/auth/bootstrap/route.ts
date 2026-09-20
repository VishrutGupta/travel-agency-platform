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

    // Check if an owner already exists
    const { count: ownerCount, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner");

    if (countError) {
      console.error("[bootstrap] Owner check error:", countError.code, countError.message);
      return NextResponse.json(
        { error: "Unable to verify account status." },
        { status: 500 }
      );
    }

    if (ownerCount && ownerCount > 0) {
      return NextResponse.json(
        { error: "An owner account already exists. Bootstrap not needed." },
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
      console.error("[bootstrap] Auth error:", signUpError.code, signUpError.message);
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

    // Set the session
    if (signUpData.session) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: signUpData.session.access_token,
        refresh_token: signUpData.session.refresh_token,
      });
      if (setSessionError) {
        console.error("[bootstrap] setSession error:", setSessionError.message);
      }
    }

    // Get the authenticated user
    const { data: { user: authUser }, error: getUserError } = await supabase.auth.getUser();
    const profileUserId = authUser?.id || signUpData.user.id;

    if (getUserError) {
      console.error("[bootstrap] getUser error:", getUserError.message);
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
        console.error("[bootstrap] Agency create error:", createAgencyError.code, createAgencyError.message);
        return NextResponse.json(
          { error: "Unable to set up agency." },
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
      console.error("[bootstrap] Profile insert error:", profileError.code, profileError.message);
      return NextResponse.json(
        { error: "Unable to create your owner profile." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: signUpData.user.id,
          email: signUpData.user.email,
          full_name: fullName,
          username: username.trim(),
        },
        requiresEmailConfirmation: !signUpData.session,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[bootstrap] Unexpected error:", message);
    if (process.env.NODE_ENV === "development") {
      throw err;
    }
    return NextResponse.json(
      { error: "Bootstrap failed. Please try again." },
      { status: 500 }
    );
  }
}
