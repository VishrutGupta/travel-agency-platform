import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, createClient, hasPermission } from "@/lib/server/authorization";
import { auditLog } from "@/lib/server/auditLog";

export async function POST(request: NextRequest) {
  console.log("[TRIP CREATE] START");

  const user = await getAuthUser(request);
  if (!user) {
    console.log("[TRIP CREATE] FAILED: Unauthorized - getAuthUser returned null");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[TRIP CREATE] Auth OK: user=", user.username, "role=", user.role, "agencyId=", user.agencyId);

  if (!hasPermission(user, "trips.create")) {
    console.log("[TRIP CREATE] FAILED: Forbidden - no trips.create permission");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { supabase } = createClient(request);
  const body = await request.json();

  console.log("[TRIP CREATE] DB INSERT START");
  const { data: trip, error } = await supabase
    .from("trips")
    .insert({
      agency_id: user.agencyId,
      title: body.title,
      slug: body.slug,
      destination: body.destination,
      region: body.region,
      start_date: body.startDate,
      end_date: body.endDate,
      duration: body.duration,
      nights: body.nights,
      price: body.price,
      original_price: body.originalPrice,
      short_description: body.shortDescription,
      description: body.description,
      cover_image_url: body.imageUrl,
      gallery_urls: body.galleryUrls || [],
      brochure_url: body.brochureUrl,
      trip_type: body.tripType,
      experience: body.experience,
      difficulty: body.difficulty,
      family_friendly: body.familyFriendly,
      featured: body.featured,
      is_active: body.isActive ?? true,
      highlights: body.highlights || [],
      inclusions: body.inclusions || [],
      exclusions: body.exclusions || [],
      itinerary: body.itinerary || [],
      important_info: body.importantInfo || [],
      max_group_size: body.maxGroupSize,
      whatsapp_number: body.whatsappNumber,
    })
    .select()
    .single();

  if (error) {
    console.log("[TRIP CREATE] FAILED: DB insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[TRIP CREATE] DB SUCCESS: trip.id=", trip.id, "trip.title=", trip.title);

  console.log("[TRIP CREATE] AUDIT START");
  const auditSuccess = await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action: "trip.create",
    resourceType: "trip",
    resourceId: trip.id,
    description: `Created trip "${trip.title}"`,
    afterData: {
      id: trip.id,
      title: trip.title,
      slug: trip.slug,
      destination: trip.destination,
      region: trip.region,
      start_date: trip.start_date,
      end_date: trip.end_date,
      duration: trip.duration,
      nights: trip.nights,
      price: trip.price,
      original_price: trip.original_price,
      trip_type: trip.trip_type,
      experience: trip.experience,
      difficulty: trip.difficulty,
      is_active: trip.is_active,
      featured: trip.featured,
    },
  });
  console.log("[TRIP CREATE] AUDIT RESULT:", auditSuccess ? "SUCCESS" : "FAILED");

  console.log("[TRIP CREATE] DONE - returning 201");
  return NextResponse.json({ trip }, { status: 201 });
}
