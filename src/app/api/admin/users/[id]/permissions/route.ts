import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission, createClient } from "@/lib/server/authorization";
import { auditLog } from "@/lib/server/auditLog";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Users can view their own permissions; others need users.permissions
  if (id !== user.id && !hasPermission(user, "users.permissions") && user.role !== "owner") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const { supabase } = createClient(request);

  const { data: perms, error } = await supabase
    .from("user_permissions")
    .select("permission")
    .eq("user_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    permissions: (perms || []).map((p: { permission: string }) => p.permission),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(user, "users.permissions") && user.role !== "owner") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const { supabase } = createClient(request);

  // Check target user exists
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, role, username")
    .eq("id", id)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (targetProfile.role === "owner") {
    return NextResponse.json({ error: "Cannot modify owner permissions." }, { status: 403 });
  }

  const { permissions } = await request.json();

  if (!Array.isArray(permissions)) {
    return NextResponse.json({ error: "Permissions must be an array." }, { status: 400 });
  }

  // Get current permissions for audit
  const { data: currentPerms } = await supabase
    .from("user_permissions")
    .select("permission")
    .eq("user_id", id);

  const oldPerms = (currentPerms || []).map((p: { permission: string }) => p.permission).sort();

  // Delete existing permissions
  await supabase
    .from("user_permissions")
    .delete()
    .eq("user_id", id);

  // Insert new permissions
  if (permissions.length > 0) {
    const rows = permissions.map((perm: string) => ({
      user_id: id,
      agency_id: user.agencyId,
      permission: perm,
    }));

    const { error: insertError } = await supabase
      .from("user_permissions")
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action: "UPDATE",
    resourceType: "Permissions",
    resourceId: id,
    description: `Updated permissions for "${targetProfile.username}"`,
    beforeData: { permissions: oldPerms },
    afterData: { permissions: permissions.sort() },
  });

  return NextResponse.json({ success: true, permissions });
}
