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
  if (!hasPermission(user, "users.view") && user.role !== "owner") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const { supabase } = createClient(request);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, agency_id, full_name, role, username, is_disabled, created_at")
    .eq("id", id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Get permissions
  const { data: perms } = await supabase
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

  const { supabase } = createClient(request);

  // Get target user
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, role, username, full_name, is_disabled")
    .eq("id", id)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Protect owner
  if (targetProfile.role === "owner" && user.role !== "owner") {
    return NextResponse.json({ error: "Cannot modify the owner account." }, { status: 403 });
  }

  const body = await request.json();
  const { fullName, role, isDisabled } = body;

  // Only owner can change roles or disable users
  if (role !== undefined || isDisabled !== undefined) {
    if (user.role !== "owner" && !hasPermission(user, "users.edit")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
  }

  // Prevent removing owner role
  if (targetProfile.role === "owner" && role && role !== "owner") {
    return NextResponse.json({ error: "Cannot change the owner's role." }, { status: 403 });
  }

  // Prevent disabling owner
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

  const beforeData = {
    fullName: targetProfile.full_name,
    role: targetProfile.role,
    isDisabled: targetProfile.is_disabled,
  };

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action: "UPDATE",
    resourceType: "User",
    resourceId: id,
    description: `Updated user "${targetProfile.username}"`,
    beforeData,
    afterData: updatePayload,
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
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const { supabase } = createClient(request);

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, role, username")
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

  // Delete profile (cascade will handle user_permissions)
  const { error: deleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Try to delete auth user (may fail if no admin key)
  await supabase.auth.admin.deleteUser(id).catch(() => {});

  await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action: "DELETE",
    resourceType: "User",
    resourceId: id,
    description: `Deleted user "${targetProfile.username}"`,
    beforeData: { username: targetProfile.username, role: targetProfile.role },
  });

  return NextResponse.json({ success: true });
}
