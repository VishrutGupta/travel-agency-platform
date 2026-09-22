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
  if (!hasPermission(user, "users.view") && user.role !== "owner") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const admin = getSupabaseAdmin();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, agency_id, full_name, role, username, is_disabled, created_at")
    .eq("id", id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { data: perms } = await admin
    .from("user_permissions")
    .select("permission")
    .eq("user_id", id);

  return NextResponse.json({
    user: {
      id: profile.id,
      agencyId: profile.agency_id,
      name: profile.full_name || "",
      username: profile.username || "",
      role: profile.role,
      isDisabled: profile.is_disabled,
      createdAt: profile.created_at,
      permissions: (perms || []).map((p: { permission: string }) => p.permission),
    },
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

  const admin = getSupabaseAdmin();
  const { supabase } = createClient(request);

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id, role, username, full_name, is_disabled")
    .eq("id", id)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (targetProfile.role === "owner" && user.role !== "owner") {
    return NextResponse.json({ error: "Cannot modify the owner account." }, { status: 403 });
  }

  const body = await request.json();
  const { fullName, role, isDisabled } = body;

  if (role !== undefined || isDisabled !== undefined) {
    if (user.role !== "owner" && !hasPermission(user, "users.edit")) {
      return NextResponse.json({ error: "You do not have permission to edit users." }, { status: 403 });
    }
  }

  if (targetProfile.role === "owner" && role && role !== "owner") {
    return NextResponse.json({ error: "Cannot change the owner's role." }, { status: 403 });
  }

  if (targetProfile.role === "owner" && isDisabled === true) {
    return NextResponse.json({ error: "Cannot disable the owner account." }, { status: 403 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (fullName !== undefined) updatePayload.full_name = fullName;
  if (role !== undefined) updatePayload.role = role;
  if (isDisabled !== undefined) updatePayload.is_disabled = isDisabled;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const beforeData: Record<string, unknown> = {
    full_name: targetProfile.full_name,
    role: targetProfile.role,
    is_disabled: targetProfile.is_disabled,
    username: targetProfile.username,
  };

  const { error: updateError } = await admin
    .from("profiles")
    .update(updatePayload)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: updatedProfile } = await admin
    .from("profiles")
    .select("id, role, username, full_name, is_disabled")
    .eq("id", id)
    .single();

  if (!updatedProfile) {
    return NextResponse.json({ error: "Update succeeded but could not verify." }, { status: 500 });
  }

  if (role !== undefined && updatedProfile.role !== role) {
    return NextResponse.json({ error: `Update failed: role is still "${updatedProfile.role}".` }, { status: 500 });
  }
  if (fullName !== undefined && updatedProfile.full_name !== fullName) {
    return NextResponse.json({ error: `Update failed: name is still "${updatedProfile.full_name}".` }, { status: 500 });
  }
  if (isDisabled !== undefined && updatedProfile.is_disabled !== isDisabled) {
    return NextResponse.json({ error: `Update failed: disabled status unchanged.` }, { status: 500 });
  }

  const DEFAULT_ADMIN_PERMISSIONS = [
    "dashboard.view",
    "trips.view", "trips.create", "trips.edit", "trips.delete",
    "settings.view", "settings.edit",
    "users.view", "users.create", "users.edit", "users.disable", "users.delete", "users.permissions",
    "logs.view",
    "storage.upload", "storage.delete",
  ];

  const DEFAULT_STAFF_PERMISSIONS = [
    "dashboard.view",
    "trips.view",
  ];

  if (role !== undefined && role !== targetProfile.role) {
    const newPerms = role === "admin" ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS;

    await admin.from("user_permissions").delete().eq("user_id", id);

    if (newPerms.length > 0) {
      const permRows = newPerms.map((perm) => ({
        user_id: id,
        agency_id: user.agencyId,
        permission: perm,
      }));
      const { error: permError } = await admin.from("user_permissions").insert(permRows);
      if (permError) {
        console.error("[USER UPDATE] Permissions sync error:", permError.message);
        return NextResponse.json({ error: "User updated but failed to sync permissions." }, { status: 500 });
      }
    }
  }

  const afterData: Record<string, unknown> = {
    full_name: updatedProfile.full_name,
    role: updatedProfile.role,
    is_disabled: updatedProfile.is_disabled,
    username: updatedProfile.username,
  };

  // Fetch actual current permissions to reflect real DB state in audit
  const { data: currentPerms } = await admin
    .from("user_permissions")
    .select("permission")
    .eq("user_id", id);
  afterData.permissions = (currentPerms || []).map((p: { permission: string }) => p.permission);

  let action = "user.update";
  let description = `Updated user "${targetProfile.username}"`;

  if (isDisabled === true && !targetProfile.is_disabled) {
    action = "user.disable";
    description = `Disabled user "${targetProfile.username}"`;
  } else if (isDisabled === false && targetProfile.is_disabled) {
    action = "user.enable";
    description = `Enabled user "${targetProfile.username}"`;
  } else if (role !== undefined && role !== targetProfile.role) {
    description = `Changed role for "${targetProfile.username}" from "${targetProfile.role}" to "${updatedProfile.role}"`;
  } else if (fullName !== undefined && fullName !== targetProfile.full_name) {
    description = `Updated name for "${targetProfile.username}"`;
  }

  await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action,
    resourceType: "user",
    resourceId: id,
    description,
    beforeData,
    afterData,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(user, "users.delete") && user.role !== "owner") {
    return NextResponse.json({ error: "You do not have permission to delete users." }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const { supabase } = createClient(request);

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id, role, username, full_name")
    .eq("id", id)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (targetProfile.role === "owner") {
    return NextResponse.json({ error: "Cannot delete the owner account." }, { status: 403 });
  }

  if (id === user.id) {
    return NextResponse.json({ error: "Cannot delete your own account." }, { status: 403 });
  }

  const beforeData = {
    username: targetProfile.username,
    full_name: targetProfile.full_name,
    role: targetProfile.role,
  };

  const { error: deleteError } = await admin
    .from("profiles")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await admin.auth.admin.deleteUser(id).catch((err) => {
    console.error("[USER DELETE] Auth user cleanup failed:", err.message);
  });

  await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action: "user.delete",
    resourceType: "user",
    resourceId: id,
    description: `Deleted user "${targetProfile.username}"`,
    beforeData,
  });

  return NextResponse.json({ success: true });
}
