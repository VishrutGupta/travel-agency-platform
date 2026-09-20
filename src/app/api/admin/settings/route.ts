import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, createClient, hasPermission } from "@/lib/server/authorization";
import { auditLog } from "@/lib/server/auditLog";

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!await hasPermission(user, "settings.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { supabase } = createClient(request);
  const body = await request.json();

  const { data: beforeAgency } = await supabase
    .from("agencies")
    .select("name, description, phone, whatsapp, email, address, instagram_url, facebook_url, website_url")
    .eq("id", user.agencyId)
    .single();

  const dbPayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) dbPayload.name = body.name;
  if (body.tagline !== undefined) dbPayload.tagline = body.tagline;
  if (body.description !== undefined) dbPayload.description = body.description;
  if (body.phone !== undefined) dbPayload.phone = body.phone;
  if (body.whatsapp !== undefined) dbPayload.whatsapp = body.whatsapp;
  if (body.email !== undefined) dbPayload.email = body.email;
  if (body.address !== undefined) dbPayload.address = body.address;
  if (body.instagram !== undefined) dbPayload.instagram_url = body.instagram;
  if (body.facebook !== undefined) dbPayload.facebook_url = body.facebook;
  if (body.website !== undefined) dbPayload.website_url = body.website;
  if (body.logo !== undefined) dbPayload.logo = body.logo;
  if (body.accentColor !== undefined) dbPayload.accent_color = body.accentColor;

  const { data: updated, error } = await supabase
    .from("agencies")
    .update(dbPayload)
    .eq("id", user.agencyId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const changedFields = Object.keys(dbPayload).filter((k) => k !== "updated_at");

  await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action: "UPDATE",
    resourceType: "Settings",
    resourceId: user.agencyId,
    description: `Updated agency settings: ${changedFields.join(", ")}`,
    beforeData: beforeAgency || undefined,
    afterData: { name: updated.name, description: updated.description },
  });

  return NextResponse.json({ agency: updated });
}
