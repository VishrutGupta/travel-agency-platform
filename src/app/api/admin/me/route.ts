import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server/authorization";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const ALL_PERMISSIONS = [
  "dashboard.view",
  "trips.view", "trips.create", "trips.edit", "trips.delete",
  "settings.view", "settings.edit",
  "users.view", "users.create", "users.edit", "users.disable", "users.delete", "users.permissions",
  "logs.view",
  "storage.upload", "storage.delete",
];

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let permissions: string[];

  if (user.role === "owner") {
    permissions = ALL_PERMISSIONS;
  } else {
    const admin = getSupabaseAdmin();
    const { data: perms } = await admin
      .from("user_permissions")
      .select("permission")
      .eq("user_id", user.id);
    permissions = (perms || []).map((p: { permission: string }) => p.permission);
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.fullName,
    },
    permissions,
  });
}
