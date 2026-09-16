import { IAuthService, User } from "../types";
import { createSupabaseClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { NextjsRequest } from "@supabase/ssr";

export class SupabaseAuthService implements IAuthService {
  private supabase: ReturnType<typeof createSupabaseClient>["default"];

  constructor(request: NextjsRequest) {
    this.supabase = createSupabaseClient(request);
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await this.supabase.auth.getUser();

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

    // Map the profile to our User type
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
      name: profile.full_name || data.user.email!.split("@")[0].replace(".", " "),
      role: profile.role || "owner",
    };

    return mappedUser;
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) throw error;
  }

  async getAgency(agencyId?: string): Promise<Agency> {
    // This service method needs the agencyId, but SupabaseAuthService gets user profile
    // For backward compatibility, we'll query the agencies table
    const { data, error } = await this.supabase
      .from("agencies")
      .select("*")
      .eq("slug", agencyId || "alpine-expeditions")
      .single();

    if (error) throw error;
    return data as Agency;
  }

  async updateAgency(
    agencyId: string,
    data: Partial<Agency>
  ): Promise<Agency> {
    const { data: updated, error } = await this.supabase
      .from("agencies")
      .update({
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: data.email,
        address: data.address,
        instagram_url: data.instagram,
        facebook_url: data.facebook,
        website_url: data.website,
        accentColor: data.accentColor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw error;
    return updated as Agency;
  }
}