import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, createClient, hasPermission } from "@/lib/server/authorization";
import { auditLog } from "@/lib/server/auditLog";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!await hasPermission(user, "trips.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { supabase } = createClient(request);
  const body = await request.json();

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog({
    supabase,
    agencyId: user.agencyId,
    actorUserId: user.id,
    actorUsername: user.username,
    action: "CREATE",
    resourceType: "Trip",
    resourceId: trip.id,
    description: `Created trip "${body.title}"`,
    afterData: { title: body.title, destination: body.destination, price: body.price },
  });

  return NextResponse.json({ trip }, { status: 201 });
}
