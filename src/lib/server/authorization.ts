import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: "owner" | "admin" | "staff";
  agencyId: string;
  fullName: string;
  isDisabled: boolean;
  permissions: string[];
}

export function createClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
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
  return { supabase, response: supabaseResponse };
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const { supabase } = createClient(request);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, agency_id, full_name, role, username, is_disabled")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return null;

  if (profile.is_disabled) return null;

  const { data: perms } = await supabase
    .from("user_permissions")
    .select("permission")
    .eq("user_id", user.id);

  return {
    id: profile.id,
    email: user.email!,
    username: profile.username || "",
    role: profile.role as "owner" | "admin" | "staff",
    agencyId: profile.agency_id,
    fullName: profile.full_name || "",
    isDisabled: profile.is_disabled,
    permissions: (perms || []).map((p: { permission: string }) => p.permission),
  };
}

export function hasPermission(user: AuthUser, permission: string): boolean {
  if (user.role === "owner") return true;
  return user.permissions.includes(permission);
}

export function requirePermission(user: AuthUser, permission: string): { allowed: boolean; error?: string } {
  if (!hasPermission(user, permission)) {
    return { allowed: false, error: `Permission denied: ${permission}` };
  }
  return { allowed: true };
}
