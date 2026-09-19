import { type IAuthService, type User, type Agency } from "@/lib/types";
import { createBrowserClient } from "@supabase/ssr";

// Create a Supabase browser client for the client side
export const createSupabaseBrowserClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Helper to check if Supabase is configured
const hasSupabase =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase-backed implementation of IAuthService.
 * Uses the browser Supabase client for auth operations with real Supabase Auth.
 */
export class SupabaseAuthService implements IAuthService {
  private supabase = createSupabaseBrowserClient();

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
      // Return basic user info if profile not found
      return {
        id: user.id,
        agencyId: "",
        email: user.email!,
        name: user.email!.split("@")[0].replace(".", " "),
        role: "owner",
      };
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

  async forgotPassword(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated.");

    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  async signup(email: string, password: string, fullName: string): Promise<User> {
    // Check if owner already exists - server-side enforcement
    const { count, error: countError } = await this.supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    if (count && count > 0) {
      // Owner already exists, reject signup
      throw new Error(
        "Owner account already exists. Please sign in."
      );
    }

    // Create the Supabase Auth user
    const { data, error: signUpError } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) throw signUpError;

    if (!data.user) {
      throw new Error("Sign up failed - no user returned.");
    }

    // Find the agency - use the default
    const { data: agency, error: agencyError } = await this.supabase
      .from("agencies")
      .select("*")
      .eq("slug", "alpine-expeditions")
      .single();

    if (agencyError) throw agencyError;

    // Create the profile with owner role
    const { error: profileError } = await this.supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        agency_id: agency.id,
        full_name: fullName,
        role: "owner",
      });

    if (profileError) throw profileError;

    const mappedUser: User = {
      id: data.user.id,
      agencyId: agency.id,
      email: data.user.email!,
      name: fullName,
      role: "owner",
    };

    return mappedUser;
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

/**
 * MockAuthService: Fallback for local development without Supabase credentials.
 * Uses localStorage for state (same as before but adapted for IAuthService).
 */
class MockAuthService implements IAuthService {
  private currentUser: User | null = null;
  private isInitialized = false;

  private init() {
    if (this.isInitialized) return;

    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("alpine_auth_user_v1");
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
        }
      } catch (e) {
        console.warn("Auth initialization error", e);
      }
    }
    this.isInitialized = true;
  }

  async getCurrentUser(): Promise<User | null> {
    this.init();
    return this.currentUser;
  }

  async login(email: string, password: string): Promise<User> {
    this.init();
    // Clean mock verification
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) {
      throw new Error("Please enter a valid email address.");
    }
    if (password.length < 4) {
      throw new Error("Password must be at least 4 characters.");
    }

    const user: User = {
      id: "owner-user-01",
      agencyId: "agency-default-01",
      email: normalized,
      name: normalized.split("@")[0].replace(".", " "),
      role: "owner",
    };

    this.currentUser = user;
    if (typeof window !== "undefined") {
      localStorage.setItem("alpine_auth_user_v1", JSON.stringify(user));
    }
    return user;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("alpine_auth_user_v1");
    }
  }

  async forgotPassword(_email: string): Promise<void> {
    // Mock: no-op
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    // Mock: no-op
  }

  async changePassword(_current: string, _new: string): Promise<void> {
    // Mock: no-op
  }

  async getAgency(_agencyId: string = "agency-default-01"): Promise<Agency> {
    this.init();
    // Return mock agency data
    return {
      id: "agency-default-01",
      name: "Alpine & Co. Expeditions",
      slug: "alpine-expeditions",
      tagline: "",
      logo: "",
      description: "Mountain expedition specialists since 2010",
      phone: "",
      whatsapp: "919820045120",
      email: "contact@alpine-expeditions.com",
      address: "",
      instagram: "",
      facebook: "",
      website: "",
      accentColor: "",
      createdAt: new Date().toISOString(),
    };
  }

  async updateAgency(
    _agencyId: string = "agency-default-01",
    data: Partial<Agency>
  ): Promise<Agency> {
    this.init();
    // In mock mode, just return the current agency data
    // Real updates would go to Supabase
    return this.getAgency(_agencyId);
  }

  async signup(email: string, password: string, fullName: string): Promise<User> {
    this.init();
    // In mock mode without Supabase, always allow but log warning
    const normalized = email.trim().toLowerCase();
    const user: User = {
      id: `mock-user-${Date.now()}`,
      agencyId: "agency-default-01",
      email: normalized,
      name: fullName || normalized.split("@")[0].replace(".", " "),
      role: "owner",
    };

    this.currentUser = user;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "alpine_auth_user_v1",
          JSON.stringify(user)
        );
      } catch (e) {
        console.warn("Failed to save mock user to localStorage", e);
      }
    }
    return user;
  }

  }

/**

/**
 * Exported singleton.
 * Uses SupabaseAuthService when NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set;
 * otherwise falls back to MockAuthService for local development.
 */
export const authService: IAuthService = hasSupabase
  ? new SupabaseAuthService()
  : new MockAuthService();