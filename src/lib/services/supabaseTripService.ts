import { type ITripService } from "./tripService";
import { type Trip, type TripFilter } from "../types";
import { createSupabaseClient } from "@/lib/supabase/client";

/**
 * Supabase-backed implementation of ITripService.
 * All database queries use snake_case column names matching the Supabase schema.
 */
export class SupabaseTripService implements ITripService {
  private supabase: ReturnType<typeof createSupabaseClient>;

  constructor() {
    this.supabase = createSupabaseClient();
  }

  async getTrips(agencyId?: string, includeInactive = false): Promise<Trip[]> {
    let query = this.supabase.from("trips").select("*");

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Trip[]) || [];
  }

  async getTripBySlug(agencyId?: string, slug?: string): Promise<Trip | null> {
    let query = this.supabase.from("trips").select("*").eq("slug", slug);

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    const { data, error } = await query.single();

    if (error) return null;
    return (data as Trip) || null;
  }

  async getTripById(agencyId?: string, id?: string): Promise<Trip | null> {
    let query = this.supabase.from("trips").select("*").eq("id", id);

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    const { data, error } = await query.single();

    if (error) return null;
    return (data as Trip) || null;
  }

  async getFeaturedTrips(agencyId?: string): Promise<Trip[]> {
    let query = this.supabase
      .from("trips")
      .select("*")
      .eq("is_active", true)
      .eq("featured", true);

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Trip[]) || [];
  }

  async getDestinations(agencyId?: string): Promise<string[]> {
    let query = this.supabase.from("trips").select("destination");

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    const { data, error } = await query;

    if (error) throw error;
    const destSet = new Set<string>();
    data?.forEach((t: { destination: string }) => destSet.add(t.destination));
    return Array.from(destSet);
  }

  async searchTrips(agencyId?: string, filters: TripFilter = {}): Promise<Trip[]> {
    let query = this.supabase.from("trips").select("*");

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    // Only expose active public trips
    query = query.eq("is_active", true);

    // Apply filters
    if (filters.destination && filters.destination !== "all") {
      const d = filters.destination.toLowerCase();
      query = query.or(`destination.ilike.%${d}%,title.ilike.%${d}%,region.ilike.%${d}%`);
    }

    if (filters.month && filters.month !== "all") {
      const monthNum = parseInt(filters.month, 10);
      if (!isNaN(monthNum)) {
        const startDate = new Date();
        startDate.setMonth(monthNum - 1, 1);
        const endDate = new Date();
        endDate.setMonth(monthNum, 0);
        query = query.gte("start_date", startDate.toISOString().split("T")[0]);
        query = query.lte("start_date", endDate.toISOString().split("T")[0]);
      }
    }

    if (filters.minDuration !== undefined) {
      query = query.gte("duration", filters.minDuration);
    }
    if (filters.maxDuration !== undefined) {
      query = query.lte("duration", filters.maxDuration);
    }

    if (filters.duration && filters.duration !== "all") {
      if (filters.duration === "short") {
        query = query.gte("duration", 2).lte("duration", 3);
      } else if (filters.duration === "medium") {
        query = query.gte("duration", 4).lte("duration", 5);
      } else if (filters.duration === "long") {
        query = query.gte("duration", 6).lte("duration", 7);
      } else if (filters.duration === "extended") {
        query = query.gte("duration", 8);
      }
    }

    if (filters.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice);
    }

    if (filters.budget && filters.budget !== "all") {
      if (filters.budget === "under20k") {
        query = query.lt("price", 20000);
      } else if (filters.budget === "20k-30k") {
        query = query.gte("price", 20000).lte("price", 30000);
      } else if (filters.budget === "30k-50k") {
        query = query.gt("price", 30000).lte("price", 50000);
      } else if (filters.budget === "above50k") {
        query = query.gt("price", 50000);
      }
    }

    if (filters.tripType && filters.tripType !== "all") {
      query = query.eq("trip_type", filters.tripType);
    }

    if (filters.experience && filters.experience !== "all") {
      query = query.eq("experience", filters.experience);
    }

    if (filters.difficulty && filters.difficulty !== "all") {
      query = query.eq("difficulty", filters.difficulty);
    }

    if (filters.familyFriendly !== undefined) {
      query = query.eq("family_friendly", filters.familyFriendly);
    }

    if (filters.featuredOnly) {
      query = query.eq("featured", true);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Trip[]) || [];
  }

  async createTrip(
    agencyId: string,
    tripData: Omit<Trip, "id" | "agencyId" | "createdAt" | "updatedAt">
  ): Promise<Trip> {
    // Use a distinct variable name to avoid duplicate 'data' identifier
    const { data: insertedTrip, error: insertError } = await this.supabase
      .from("trips")
      .insert({
        agency_id: agencyId,
        title: tripData.title,
        slug: tripData.slug,
        destination: tripData.destination,
        region: tripData.region,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        duration: tripData.duration,
        nights: tripData.nights,
        price: tripData.price,
        original_price: tripData.originalPrice,
        short_description: tripData.shortDescription,
        description: tripData.description,
        cover_image_url: tripData.imageUrl,
        gallery_urls: tripData.galleryUrls || [],
        brochure_url: tripData.brochureUrl,
        trip_type: tripData.tripType,
        experience: tripData.experience,
        difficulty: tripData.difficulty,
        family_friendly: tripData.familyFriendly,
        featured: tripData.featured,
        is_active: tripData.isActive,
        highlights: tripData.highlights || [],
        inclusions: tripData.inclusions || [],
        exclusions: tripData.exclusions || [],
        itinerary: tripData.itinerary || [],
        important_info: tripData.importantInfo || [],
        max_group_size: tripData.maxGroupSize,
        whatsapp_number: tripData.whatsappNumber,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return insertedTrip as Trip;
  }

  async updateTrip(agencyId: string, id: string, tripData: Partial<Trip>): Promise<Trip> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (tripData.title !== undefined) updatePayload.title = tripData.title;
    if (tripData.slug !== undefined) updatePayload.slug = tripData.slug;
    if (tripData.destination !== undefined) updatePayload.destination = tripData.destination;
    if (tripData.region !== undefined) updatePayload.region = tripData.region;
    if (tripData.startDate !== undefined) updatePayload.start_date = tripData.startDate;
    if (tripData.endDate !== undefined) updatePayload.end_date = tripData.endDate;
    if (tripData.duration !== undefined) updatePayload.duration = tripData.duration;
    if (tripData.nights !== undefined) updatePayload.nights = tripData.nights;
    if (tripData.price !== undefined) updatePayload.price = tripData.price;
    if (tripData.originalPrice !== undefined) updatePayload.original_price = tripData.originalPrice;
    if (tripData.shortDescription !== undefined) updatePayload.short_description = tripData.shortDescription;
    if (tripData.description !== undefined) updatePayload.description = tripData.description;
    if (tripData.imageUrl !== undefined) updatePayload.cover_image_url = tripData.imageUrl;
    if (tripData.galleryUrls !== undefined) updatePayload.gallery_urls = tripData.galleryUrls;
    if (tripData.brochureUrl !== undefined) updatePayload.brochure_url = tripData.brochureUrl;
    if (tripData.tripType !== undefined) updatePayload.trip_type = tripData.tripType;
    if (tripData.experience !== undefined) updatePayload.experience = tripData.experience;
    if (tripData.difficulty !== undefined) updatePayload.difficulty = tripData.difficulty;
    if (tripData.familyFriendly !== undefined) updatePayload.family_friendly = tripData.familyFriendly;
    if (tripData.featured !== undefined) updatePayload.featured = tripData.featured;
    if (tripData.isActive !== undefined) updatePayload.is_active = tripData.isActive;
    if (tripData.highlights !== undefined) updatePayload.highlights = tripData.highlights;
    if (tripData.inclusions !== undefined) updatePayload.inclusions = tripData.inclusions;
    if (tripData.exclusions !== undefined) updatePayload.exclusions = tripData.exclusions;
    if (tripData.itinerary !== undefined) updatePayload.itinerary = tripData.itinerary;
    if (tripData.importantInfo !== undefined) updatePayload.important_info = tripData.importantInfo;
    if (tripData.maxGroupSize !== undefined) updatePayload.max_group_size = tripData.maxGroupSize;
    if (tripData.whatsappNumber !== undefined) updatePayload.whatsapp_number = tripData.whatsappNumber;

    // Use a distinct variable name to avoid duplicate 'data' identifier
    const { data: updatedTrip, error: updateError } = await this.supabase
      .from("trips")
      .update(updatePayload)
      .eq("id", id)
      .eq("agency_id", agencyId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedTrip as Trip;
  }

  async deleteTrip(agencyId: string, id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("trips")
      .delete()
      .eq("id", id)
      .eq("agency_id", agencyId);

    if (error) throw error;
    return true;
  }

  async toggleTripStatus(agencyId: string, id: string): Promise<Trip> {
    // First get the current trip status
    const { data: currentTrip, error: fetchError } = await this.supabase
      .from("trips")
      .select("is_active")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!currentTrip) throw new Error("Trip not found");

    const { data: toggledTrip, error: toggleError } = await this.supabase
      .from("trips")
      .update({
        is_active: !currentTrip.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (toggleError) throw toggleError;
    return toggledTrip as Trip;
  }
}