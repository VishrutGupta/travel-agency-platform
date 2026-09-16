import { IAuthService } from "../types";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { NextjsRequest } from "@supabase/ssr";

export class SupabaseAgencyService {
  private supabase: ReturnType<typeof createSupabaseClient>["default"];

  constructor(request: NextjsRequest) {
    this.supabase = createSupabaseClient(request);
  }

  async getAgency(slug: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("agencies")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data;
  }

  async updateAgencySettings(
    agencyId: string,
    data: any
  ): Promise<any> {
    const { data: updated, error } = await this.supabase
      .from("agencies")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agencyId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }
}