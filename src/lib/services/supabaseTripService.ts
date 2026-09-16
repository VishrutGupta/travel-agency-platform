import { ITripService } from "../types";
import { Trip, TripFilter } from "../types";
import { createSupabaseClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export class SupabaseTripService implements ITripService {
  private supabase: ReturnType<typeof createSupabaseClient>["default"];

  constructor(request: any) {
    this.supabase = createSupabaseClient(request);
  }

  async getTrips(
    agencyId?: string,
    includeInactive = false
  ): Promise<Trip[]> {
    let query = this.supabase.from("trips").select("*");

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTripBySlug(
    agencyId?: string,
    slug?: string
  ): Promise<Trip | null> {
    let query = this.supabase.from("trips").select("*").eq("slug", slug);

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data || null;
  }

  async getTripById(
    agencyId?: string,
    id?: string
  ): Promise<Trip | null> {
    let query = this.supabase.from("trips").select("*").eq("id", id);

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data || null;
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

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data || [];
  }

  async getDestinations(agencyId?: string): Promise<string[]> {
    let query = this.supabase.from("trips").select("destination");

    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    const { data, error } = await query;

    if (error) throw error;
    const destSet = new Set<string>();
    data?.forEach((t: any) => destSet.add(t.destination));
    return Array.from(destSet);
  }

  async searchTrips(
    agencyId?: string,
    filters: TripFilter = {}
  ): Promise<Trip[]> {
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

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data || [];
  }

  async createTrip(
    agencyId: string,
    data: Omit<Trip, "id" | "agencyId" | "createdAt" | "updatedAt">
  ): Promise<Trip> {
    const { data, error } = await this.supabase
      .from("trips")
      .insert({
        agency_id: agencyId,
        title: data.title,
        slug: data.slug,
        destination: data.destination,
        region: data.region,
        start_date: data.startDate,
        end_date: data.endDate,
        duration: data.duration,
        nights: data.nights,
        price: data.price,
        original_price: data.originalPrice,
        short_description: data.shortDescription,
        description: data.description,
        cover_image_url: data.imageUrl,
        gallery_urls: data.galleryUrls || [],
        brochure_url: data.brochureUrl,
        trip_type: data.tripType,
        experience: data.experience,
        difficulty: data.difficulty,
        family_friendly: data.familyFriendly,
        featured: data.featured,
        is_active: data.isActive,
        highlights: data.highlights || [],
        inclusions: data.inclusions || [],
        exclusions: data.exclusions || [],
        itinerary: data.itinerary || [],
        important_info: data.importantInfo || [],
        max_group_size: data.maxGroupSize,
        whatsapp_number: data.whatsappNumber,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Trip;
  }

  async updateTrip(
    agencyId: string,
    id: string,
    data: Partial<Trip>
  ): Promise<Trip> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.destination !== undefined) updateData.destination = data.destination;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.nights !== undefined) updateData.nights = data.nights;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.originalPrice !== undefined) updateData.original_price = data.originalPrice;
    if (data.shortDescription !== undefined)
      updateData.short_description = data.shortDescription;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.cover_image_url = data.imageUrl;
    if (data.galleryUrls !== undefined) updateData.gallery_urls = data.galleryUrls;
    if (data.brochureUrl !== undefined) updateData.brochure_url = data.brochureUrl;
    if (data.tripType !== undefined) updateData.trip_type = data.tripType;
    if (data.experience !== undefined) updateData.experience = data.experience;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.familyFriendly !== undefined)
      updateData.family_friendly = data.familyFriendly;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.highlights !== undefined) updateData.highlights = data.highlights;
    if (data.inclusions !== undefined) updateData.inclusions = data.inclusions;
    if (data.exclusions !== undefined) updateData.exclusions = data.exclusions;
    if (data.itinerary !== undefined) updateData.itinerary = data.itinerary;
    if (data.importantInfo !== undefined)
      updateData.important_info = data.importantInfo;
    if (data.maxGroupSize !== undefined) updateData.max_group_size = data.maxGroupSize;
    if (data.whatsappNumber !== undefined)
      updateData.whatsapp_number = data.whatsappNumber;

    const { data, error } = await this.supabase
      .from("trips")
      .update(updateData)
      .eq("id", id)
      .eq("agency_id", agencyId)
      .select()
      .single();

    if (error) throw error;
    return data as Trip;
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

  async toggleTripStatus(
    agencyId: string,
    id: string
  ): Promise<Trip> {
    // First get the current trip to determine the toggle state
    const { data: currentTrip, error: fetchError } = await this.supabase
      .from("trips")
      .select("is_active")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!currentTrip) throw new Error("Trip not found");

    const { data, error } = await this.supabase
      .from("trips")
      .update({ is_active: !currentTrip.is_active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Trip;
  }
}