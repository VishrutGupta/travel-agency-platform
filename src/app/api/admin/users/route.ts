import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission, createClient } from "@/lib/server/authorization";
import { auditLog } from "@/lib/server/auditLog";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(user, "users.view") && user.role !== "owner") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const { supabase } = createClient(request);

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, agency_id, full_name, role, username, is_disabled, created_at")
    .eq("agency_id", user.agencyId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with email from auth (only accessible via SECURITY DEFINER)
  const enriched = (profiles || []).map((p: Record<string, unknown>) => ({
    id: p.id,
    agencyId: p.agency_id,
    name: p.full_name || "",
    username: p.username || "",
    role: p.role,
    isDisabled: p.is_disabled,
    createdAt: p.created_at,
  }));

  return NextResponse.json({ users: enriched });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(user, "users.create") && user.role !== "owner") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const { email, password, fullName, username, role } = await request.json();

  if (!email || !password || !fullName || !username || !role) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (role === "owner") {
    return NextResponse.json({ error: "Cannot create additional owner accounts." }, { status: 403 });
  }

  const { supabase, response } = createClient(request);

  // Check username uniqueness
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Username already taken." }, { status: 409 });
  }

  // Create auth user
  const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (signUpError) {
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  if (!signUpData.user) {
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }

  // Create profile
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: signUpData.user.id,
      agency_id: user.agencyId,
      full_name: fullName,
      role,
      username: username.trim(),
      is_disabled: false,
    });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Audit log
  await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action: "CREATE",
    resourceType: "User",
    resourceId: signUpData.user.id,
    description: `Created user "${username}" with role "${role}"`,
    afterData: { username, role, fullName },
  });

  return NextResponse.json({ success: true, user: { id: signUpData.user.id, username, role } }, { status: 201 });
}
