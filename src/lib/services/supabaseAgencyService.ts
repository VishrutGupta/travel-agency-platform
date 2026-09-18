import { createSupabaseClient } from "@/lib/supabase/client";
import type { Agency } from "../types";

/**
 * Supabase-backed service for reading and updating agency/settings data.
 * Instantiated per-request on the client side using the browser Supabase client.
 */
export class SupabaseAgencyService {
  private supabase: ReturnType<typeof createSupabaseClient>;

  constructor() {
    this.supabase = createSupabaseClient();
  }

  async getAgency(slug: string): Promise<Agency> {
    const { data, error } = await this.supabase
      .from("agencies")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data as Agency;
  }

  async updateAgencySettings(
    agencyId: string,
    updateData: Partial<Agency>
  ): Promise<Agency> {
    const { data: updated, error } = await this.supabase
      .from("agencies")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agencyId)
      .select()
      .single();

    if (error) throw error;
    return updated as Agency;
  }
}