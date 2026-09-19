import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await createSupabaseServerClient(request);

    const { data: { user } } = await supabase.auth.getUser();

    // Count profiles with owner role
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner");

    if (error) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({ exists: (count ?? 0) > 0 });
  } catch {
    return NextResponse.json({ exists: false }, { status: 200 });
  }
}
