import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, createClient, hasPermission } from "@/lib/server/authorization";
import { auditLog } from "@/lib/server/auditLog";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(user, "trips.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { supabase } = createClient(request);

  const { data: trip, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .eq("agency_id", user.agencyId)
    .single();

  if (error || !trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  return NextResponse.json({ trip });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("[TRIP UPDATE] START");

  const user = await getAuthUser(request);
  if (!user) {
    console.log("[TRIP UPDATE] FAILED: Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[TRIP UPDATE] Auth OK: user=", user.username, "role=", user.role, "agencyId=", user.agencyId);

  if (!hasPermission(user, "trips.edit")) {
    console.log("[TRIP UPDATE] FAILED: Forbidden");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { supabase } = createClient(request);
  const body = await request.json();

  console.log("[TRIP UPDATE] Fetching before trip state");
  const { data: beforeTrip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.title !== undefined) updatePayload.title = body.title;
  if (body.slug !== undefined) updatePayload.slug = body.slug;
  if (body.destination !== undefined) updatePayload.destination = body.destination;
  if (body.region !== undefined) updatePayload.region = body.region;
  if (body.startDate !== undefined) updatePayload.start_date = body.startDate;
  if (body.endDate !== undefined) updatePayload.end_date = body.endDate;
  if (body.duration !== undefined) updatePayload.duration = body.duration;
  if (body.nights !== undefined) updatePayload.nights = body.nights;
  if (body.price !== undefined) updatePayload.price = body.price;
  if (body.originalPrice !== undefined) updatePayload.original_price = body.originalPrice;
  if (body.shortDescription !== undefined) updatePayload.short_description = body.shortDescription;
  if (body.description !== undefined) updatePayload.description = body.description;
  if (body.imageUrl !== undefined) updatePayload.cover_image_url = body.imageUrl;
  if (body.galleryUrls !== undefined) updatePayload.gallery_urls = body.galleryUrls;
  if (body.brochureUrl !== undefined) updatePayload.brochure_url = body.brochureUrl;
  if (body.tripType !== undefined) updatePayload.trip_type = body.tripType;
  if (body.experience !== undefined) updatePayload.experience = body.experience;
  if (body.difficulty !== undefined) updatePayload.difficulty = body.difficulty;
  if (body.familyFriendly !== undefined) updatePayload.family_friendly = body.familyFriendly;
  if (body.featured !== undefined) updatePayload.featured = body.featured;
  if (body.isActive !== undefined) updatePayload.is_active = body.isActive;
  if (body.highlights !== undefined) updatePayload.highlights = body.highlights;
  if (body.inclusions !== undefined) updatePayload.inclusions = body.inclusions;
  if (body.exclusions !== undefined) updatePayload.exclusions = body.exclusions;
  if (body.itinerary !== undefined) updatePayload.itinerary = body.itinerary;
  if (body.importantInfo !== undefined) updatePayload.important_info = body.importantInfo;
  if (body.maxGroupSize !== undefined) updatePayload.max_group_size = body.maxGroupSize;
  if (body.whatsappNumber !== undefined) updatePayload.whatsapp_number = body.whatsappNumber;

  console.log("[TRIP UPDATE] DB UPDATE START, id=", id);
  const { data: trip, error } = await supabase
    .from("trips")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.log("[TRIP UPDATE] FAILED: DB update error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[TRIP UPDATE] DB SUCCESS: trip.id=", trip.id);

  console.log("[TRIP UPDATE] AUDIT START");
  const auditSuccess = await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action: "trip.update",
    resourceType: "trip",
    resourceId: id,
    description: `Updated trip "${trip.title}"`,
    beforeData: beforeTrip ? {
      id: beforeTrip.id,
      title: beforeTrip.title,
      slug: beforeTrip.slug,
      destination: beforeTrip.destination,
      region: beforeTrip.region,
      start_date: beforeTrip.start_date,
      end_date: beforeTrip.end_date,
      duration: beforeTrip.duration,
      nights: beforeTrip.nights,
      price: beforeTrip.price,
      original_price: beforeTrip.original_price,
      short_description: beforeTrip.short_description,
      description: beforeTrip.description,
      cover_image_url: beforeTrip.cover_image_url,
      gallery_urls: beforeTrip.gallery_urls,
      brochure_url: beforeTrip.brochure_url,
      trip_type: beforeTrip.trip_type,
      experience: beforeTrip.experience,
      difficulty: beforeTrip.difficulty,
      family_friendly: beforeTrip.family_friendly,
      is_active: beforeTrip.is_active,
      featured: beforeTrip.featured,
      highlights: beforeTrip.highlights,
      inclusions: beforeTrip.inclusions,
      exclusions: beforeTrip.exclusions,
      itinerary: beforeTrip.itinerary,
      important_info: beforeTrip.important_info,
      max_group_size: beforeTrip.max_group_size,
      whatsapp_number: beforeTrip.whatsapp_number,
    } : null,
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
      short_description: trip.short_description,
      description: trip.description,
      cover_image_url: trip.cover_image_url,
      gallery_urls: trip.gallery_urls,
      brochure_url: trip.brochure_url,
      trip_type: trip.trip_type,
      experience: trip.experience,
      difficulty: trip.difficulty,
      family_friendly: trip.family_friendly,
      is_active: trip.is_active,
      featured: trip.featured,
      highlights: trip.highlights,
      inclusions: trip.inclusions,
      exclusions: trip.exclusions,
      itinerary: trip.itinerary,
      important_info: trip.important_info,
      max_group_size: trip.max_group_size,
      whatsapp_number: trip.whatsapp_number,
    },
  });
  console.log("[TRIP UPDATE] AUDIT RESULT:", auditSuccess ? "SUCCESS" : "FAILED");

  console.log("[TRIP UPDATE] DONE - returning 200");
  return NextResponse.json({ trip });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("[TRIP DELETE] START");

  const user = await getAuthUser(request);
  if (!user) {
    console.log("[TRIP DELETE] FAILED: Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[TRIP DELETE] Auth OK: user=", user.username, "role=", user.role, "agencyId=", user.agencyId);

  if (!hasPermission(user, "trips.delete")) {
    console.log("[TRIP DELETE] FAILED: Forbidden");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { supabase } = createClient(request);

  console.log("[TRIP DELETE] Fetching before trip state");
  const { data: beforeTrip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  console.log("[TRIP DELETE] DB DELETE START, id=", id);
  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", id);

  if (error) {
    console.log("[TRIP DELETE] FAILED: DB delete error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[TRIP DELETE] DB SUCCESS");

  console.log("[TRIP DELETE] AUDIT START");
  const auditSuccess = await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action: "trip.delete",
    resourceType: "trip",
    resourceId: id,
    description: `Deleted trip "${beforeTrip?.title || id}"`,
    beforeData: beforeTrip ? {
      id: beforeTrip.id,
      title: beforeTrip.title,
      slug: beforeTrip.slug,
      destination: beforeTrip.destination,
      region: beforeTrip.region,
      start_date: beforeTrip.start_date,
      end_date: beforeTrip.end_date,
      duration: beforeTrip.duration,
      nights: beforeTrip.nights,
      price: beforeTrip.price,
      original_price: beforeTrip.original_price,
      short_description: beforeTrip.short_description,
      description: beforeTrip.description,
      cover_image_url: beforeTrip.cover_image_url,
      gallery_urls: beforeTrip.gallery_urls,
      brochure_url: beforeTrip.brochure_url,
      trip_type: beforeTrip.trip_type,
      experience: beforeTrip.experience,
      difficulty: beforeTrip.difficulty,
      family_friendly: beforeTrip.family_friendly,
      is_active: beforeTrip.is_active,
      featured: beforeTrip.featured,
      highlights: beforeTrip.highlights,
      inclusions: beforeTrip.inclusions,
      exclusions: beforeTrip.exclusions,
      itinerary: beforeTrip.itinerary,
      important_info: beforeTrip.important_info,
      max_group_size: beforeTrip.max_group_size,
      whatsapp_number: beforeTrip.whatsapp_number,
    } : null,
  });
  console.log("[TRIP DELETE] AUDIT RESULT:", auditSuccess ? "SUCCESS" : "FAILED");

  console.log("[TRIP DELETE] DONE - returning 200");
  return NextResponse.json({ success: true });
}
