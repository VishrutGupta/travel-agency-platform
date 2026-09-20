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
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(user, "trips.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { supabase } = createClient(request);
  const body = await request.json();

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

  const { data: trip, error } = await supabase
    .from("trips")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog({
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
      trip_type: beforeTrip.trip_type,
      experience: beforeTrip.experience,
      difficulty: beforeTrip.difficulty,
      is_active: beforeTrip.is_active,
      featured: beforeTrip.featured,
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
      trip_type: trip.trip_type,
      experience: trip.experience,
      difficulty: trip.difficulty,
      is_active: trip.is_active,
      featured: trip.featured,
    },
  });

  return NextResponse.json({ trip });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(user, "trips.delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { supabase } = createClient(request);

  const { data: beforeTrip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog({
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
      trip_type: beforeTrip.trip_type,
      experience: beforeTrip.experience,
      difficulty: beforeTrip.difficulty,
      is_active: beforeTrip.is_active,
      featured: beforeTrip.featured,
    } : null,
  });

  return NextResponse.json({ success: true });
}
