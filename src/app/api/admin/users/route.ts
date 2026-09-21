import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission, createClient } from "@/lib/server/authorization";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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
    return NextResponse.json({ error: "Only owners can create users." }, { status: 403 });
  }

  const { email, password, fullName, username, role } = await request.json();

  if (!email || !password || !fullName || !username || !role) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (role === "owner") {
    return NextResponse.json({ error: "Cannot create additional owner accounts." }, { status: 403 });
  }

  if (!["admin", "staff"].includes(role)) {
    return NextResponse.json({ error: "Invalid role. Must be admin or staff." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { supabase, response } = createClient(request);

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username.trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Username already taken." }, { status: 409 });
  }

  const { data: signUpData, error: signUpError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (signUpError) {
    console.error("[USER CREATE] Auth error:", signUpError.message);
    const msg = signUpError.message.includes("already")
      ? "Email already registered."
      : "Unable to create the user. Please try again.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (!signUpData.user) {
    return NextResponse.json({ error: "Unable to create the user. Please try again." }, { status: 500 });
  }

  const { error: profileError } = await admin
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
    console.error("[USER CREATE] Profile error:", profileError.message);
    await admin.auth.admin.deleteUser(signUpData.user.id).catch(() => {});
    return NextResponse.json({ error: "Failed to create user profile." }, { status: 500 });
  }

  await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action: "user.create",
    resourceType: "user",
    resourceId: signUpData.user.id,
    description: `Created user "${username}" with role "${role}"`,
    afterData: {
      full_name: fullName,
      username: username.trim(),
      role,
      is_disabled: false,
      agency_id: user.agencyId,
    },
  });

  return NextResponse.json({ success: true, user: { id: signUpData.user.id, username, role } }, { status: 201 });
}
