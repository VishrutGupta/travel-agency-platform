import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { auditLog } from "@/lib/server/auditLog";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }

  let supabaseResponse: NextResponse = NextResponse.next({ request });
  const cookiesToReturn: { name: string; value: string; options?: Record<string, unknown> }[] = [];
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
          cookiesToSet.forEach(({ name, value, options }) => cookiesToReturn.push({ name, value, options }));
        },
      },
    }
  );

  // Step 1: Look up the auth email from the username
  console.log("[login] Step 1: Looking up auth email for username:", username.trim());
  const { data: authEmail, error: lookupError } = await supabase
    .rpc("lookup_auth_email_by_username", { p_username: username.trim() });

  if (lookupError) {
    console.error("[login] Step 1 FAILED - Username lookup error:", {
      code: lookupError.code,
      message: lookupError.message,
      details: lookupError.details,
      hint: lookupError.hint,
    });

    if (lookupError.code === "PGRST202" || lookupError.message?.includes("Could not find the function")) {
      console.error("[login] DIAGNOSIS: The lookup_auth_email_by_username function does not exist. Database migrations have not been applied.");
      return NextResponse.json(
        { error: "Database not configured. Please run the setup SQL in Supabase SQL Editor." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unable to sign in. Please contact the administrator." },
      { status: 500 }
    );
  }

  console.log("[login] Step 1 result - authEmail:", authEmail ? "(found)" : "(null)");

  if (!authEmail) {
    console.error("[login] Step 1 FAILED - No auth email found for username:", username.trim());
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  // Step 2: Sign in with Supabase Auth
  console.log("[login] Step 2: Signing in with Supabase Auth...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password,
  });

  if (signInError) {
    console.error("[login] Step 2 FAILED - Auth sign-in error:", {
      code: signInError.code,
      message: signInError.message,
      status: signInError.status,
    });
    if (signInError.code === "email_not_confirmed") {
      return NextResponse.json(
        { error: "Please verify your email before signing in." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  if (!signInData.user) {
    console.error("[login] Step 2 FAILED - signInWithPassword returned no user");
    return NextResponse.json(
      { error: "Unable to sign in. Please contact the administrator." },
      { status: 500 }
    );
  }

  console.log("[login] Step 2 result - signInData.user.id:", signInData.user.id);

  // Step 3: Verify the profile exists
  console.log("[login] Step 3: Looking up profile for user ID:", signInData.user.id);
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, agency_id, full_name, role, username, is_disabled")
    .eq("id", signInData.user.id)
    .single();

  if (profileError || !profile) {
    console.error("[login] Step 3 FAILED - Profile lookup error:", {
      code: profileError?.code,
      message: profileError?.message,
      details: profileError?.details,
      hint: profileError?.hint,
    });

    if (profileError?.code === "PGRST205" || profileError?.message?.includes("Could not find the table")) {
      console.error("[login] DIAGNOSIS: The profiles table does not exist. Database migrations have not been applied.");
      return NextResponse.json(
        { error: "Database not configured. Please run the setup SQL in Supabase SQL Editor." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Your admin profile is not configured correctly. Please contact the administrator.",
        _diagnostic: {
          profileError: profileError ? {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
          } : null,
          signInUserId: signInData.user.id,
        },
      },
      { status: 500 }
    );
  }

  console.log("[login] Step 3 result - profile:", {
    id: profile.id,
    agency_id: profile.agency_id,
    role: profile.role,
    username: profile.username,
    is_disabled: profile.is_disabled,
  });

  if (profile.is_disabled) {
    return NextResponse.json(
      { error: "Your account has been disabled. Please contact the administrator." },
      { status: 403 }
    );
  }

  // Step 4: Log successful login
  await auditLog({
    supabase,
    agencyId: profile.agency_id,
    actorUserId: signInData.user.id,
    actorUsername: profile.username || username,
    action: "LOGIN",
    resourceType: "Auth",
    description: `User "${profile.username || username}" logged in successfully`,
  });

  const response = NextResponse.json(
    {
      success: true,
      user: {
        id: profile.id,
        agencyId: profile.agency_id,
        email: signInData.user.email,
        name: profile.full_name || username,
        role: profile.role,
        username: profile.username,
      },
    },
    { status: 200 }
  );

  cookiesToReturn.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as any);
  });

  return response;
}
