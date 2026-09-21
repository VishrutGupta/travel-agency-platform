import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission, createClient } from "@/lib/server/authorization";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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

  if (id !== user.id && !hasPermission(user, "users.permissions") && user.role !== "owner") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const admin = getSupabaseAdmin();

  const { data: perms, error } = await admin
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
  const admin = getSupabaseAdmin();

  const { data: targetProfile } = await admin
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

  const { data: currentPerms } = await admin
    .from("user_permissions")
    .select("permission")
    .eq("user_id", id);

  const oldPerms = (currentPerms || []).map((p: { permission: string }) => p.permission).sort();

  await admin
    .from("user_permissions")
    .delete()
    .eq("user_id", id);

  if (permissions.length > 0) {
    const rows = permissions.map((perm: string) => ({
      user_id: id,
      agency_id: user.agencyId,
      permission: perm,
    }));

    const { error: insertError } = await admin
      .from("user_permissions")
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const newPerms = [...permissions].sort();
  const added = newPerms.filter((p) => !oldPerms.includes(p));
  const removed = oldPerms.filter((p) => !newPerms.includes(p));

  let description = `Updated permissions for "${targetProfile.username}"`;
  if (added.length > 0 && removed.length > 0) {
    description = `Changed permissions for "${targetProfile.username}": ${added.length} added, ${removed.length} removed`;
  } else if (added.length > 0) {
    description = `Added ${added.length} permission${added.length !== 1 ? "s" : ""} for "${targetProfile.username}"`;
  } else if (removed.length > 0) {
    description = `Removed ${removed.length} permission${removed.length !== 1 ? "s" : ""} from "${targetProfile.username}"`;
  }

  await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action: "user.permissions.update",
    resourceType: "user",
    resourceId: id,
    description,
    beforeData: { permissions: oldPerms },
    afterData: { permissions: newPerms },
  });

  return NextResponse.json({ success: true, permissions });
}
