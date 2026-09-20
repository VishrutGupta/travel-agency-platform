import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const diagnostics: Record<string, unknown> = {};

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

  // 1. Check if the lookup function exists
  console.log("[diagnose] Checking if lookup_auth_email_by_username function exists...");
  const { data: funcTest, error: funcError } = await supabase
    .rpc("lookup_auth_email_by_username", { p_username: "nonexistent_test_user" });

  diagnostics.functionExists = !funcError;
  diagnostics.functionTestResult = funcTest;
  diagnostics.functionError = funcError ? {
    code: funcError.code,
    message: funcError.message,
    details: funcError.details,
    hint: funcError.hint,
  } : null;

  // 2. Check if profiles table has the expected columns
  console.log("[diagnose] Checking profiles table structure...");
  const { data: profilesCheck, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, role, agency_id, is_disabled, full_name")
    .limit(10);

  diagnostics.profilesQueryWorks = !profilesError;
  diagnostics.profilesCount = profilesCheck?.length || 0;
  diagnostics.profiles = profilesCheck || [];
  diagnostics.profilesError = profilesError ? {
    code: profilesError.code,
    message: profilesError.message,
    details: profilesError.details,
  } : null;

  // 3. Check if agencies table has data
  console.log("[diagnose] Checking agencies table...");
  const { data: agencies, error: agenciesError } = await supabase
    .from("agencies")
    .select("id, name, slug")
    .limit(10);

  diagnostics.agenciesCount = agencies?.length || 0;
  diagnostics.agencies = agencies || [];
  diagnostics.agenciesError = agenciesError ? {
    code: agenciesError.code,
    message: agenciesError.message,
  } : null;

  // 4. Check if user_permissions table exists
  console.log("[diagnose] Checking user_permissions table...");
  const { error: permsError } = await supabase
    .from("user_permissions")
    .select("id")
    .limit(1);

  diagnostics.userPermissionsTableExists = !permsError;
  diagnostics.userPermissionsError = permsError ? {
    code: permsError.code,
    message: permsError.message,
  } : null;

  // 5. Check if audit_logs table exists
  console.log("[diagnose] Checking audit_logs table...");
  const { error: auditError } = await supabase
    .from("audit_logs")
    .select("id")
    .limit(1);

  diagnostics.auditLogsTableExists = !auditError;
  diagnostics.auditLogsError = auditError ? {
    code: auditError.code,
    message: auditError.message,
  } : null;

  // 6. Check for administrator specifically
  console.log("[diagnose] Looking up administrator user...");
  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("id, username, role, agency_id, is_disabled")
    .eq("username", "administrator")
    .single();

  diagnostics.administratorExists = !adminError && !!adminProfile;
  diagnostics.administratorProfile = adminProfile || null;
  diagnostics.administratorError = adminError ? {
    code: adminError.code,
    message: adminError.message,
  } : null;

  // 7. Try the lookup function for administrator
  if (diagnostics.functionExists) {
    console.log("[diagnose] Trying lookup_auth_email_by_username for 'administrator'...");
    const { data: emailLookup, error: lookupErr } = await supabase
      .rpc("lookup_auth_email_by_username", { p_username: "administrator" });

    diagnostics.emailLookupResult = emailLookup ? "(found)" : "(null)";
    diagnostics.emailLookupError = lookupErr ? {
      code: lookupErr.code,
      message: lookupErr.message,
      details: lookupErr.details,
    } : null;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
