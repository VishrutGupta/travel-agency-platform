import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, createClient } from "@/lib/server/authorization";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabase } = createClient(request);

  // Use the SECURITY DEFINER function to get permissions
  const { data: permissions, error } = await supabase
    .rpc("get_user_permissions", { p_user_id: user.id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.fullName,
    },
    permissions: permissions || [],
  });
}
