import { type IAuthService } from "./authService";
import { type Agency, type User } from "../types";
import { createSupabaseClient } from "@/lib/supabase/client";

/**
 * Supabase-backed implementation of IAuthService.
 * Uses the browser Supabase client (createBrowserClient) for auth operations.
 */
export class SupabaseAuthService implements IAuthService {
  private supabase: ReturnType<typeof createSupabaseClient>;

  constructor() {
    this.supabase = createSupabaseClient();
  }

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();

    if (error) {
      console.error("Supabase auth error:", error);
      return null;
    }

    if (!user) {
      return null;
    }

    // Fetch the profile from the profiles table to get agency_id and role
    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return null;
    }

    const mappedUser: User = {
      id: profile.id,
      agencyId: profile.agency_id,
      email: user.email!,
      name: profile.full_name || user.email!.split("@")[0].replace(".", " "),
      role: profile.role || "owner",
    };

    return mappedUser;
  }

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error("Login failed - no user returned.");
    }

    // Fetch the profile
    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) throw profileError;

    const mappedUser: User = {
      id: profile.id,
      agencyId: profile.agency_id,
      email: profile.email || data.user.email!,
      name:
        profile.full_name || data.user.email!.split("@")[0].replace(".", " "),
      role: profile.role || "owner",
    };

    return mappedUser;
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getAgency(agencyId?: string): Promise<Agency> {
    const { data, error } = await this.supabase
      .from("agencies")
      .select("*")
      .eq("slug", agencyId || "alpine-expeditions")
      .single();

    if (error) throw error;
    return data as Agency;
  }

  async updateAgency(agencyId: string, updateData: Partial<Agency>): Promise<Agency> {
    const { data: updated, error } = await this.supabase
      .from("agencies")
      .update({
        name: updateData.name,
        tagline: updateData.tagline,
        description: updateData.description,
        phone: updateData.phone,
        whatsapp: updateData.whatsapp,
        email: updateData.email,
        address: updateData.address,
        instagram_url: updateData.instagram,
        facebook_url: updateData.facebook,
        website_url: updateData.website,
        accentColor: updateData.accentColor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", updateData.id)
      .select()
      .single();

    if (error) throw error;
    return updated as Agency;
  }
}