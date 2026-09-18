import { Agency, User } from "../types";
import { mockAgency, DEFAULT_AGENCY_ID } from "../data/mockAgency";
import { SupabaseAuthService } from "./supabaseAuthService";

export interface IAuthService {
  getCurrentUser(): Promise<User | null>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getAgency(agencyId?: string): Promise<Agency>;
  updateAgency(agencyId: string, data: Partial<Agency>): Promise<Agency>;
}

const AUTH_USER_KEY = "alpine_auth_user_v1";
const AGENCY_KEY = "alpine_agency_settings_v1";

class MockAuthService implements IAuthService {
  private currentUser: User | null = null;
  private agencyData: Agency = mockAgency;
  private isInitialized = false;

  private init() {
    if (this.isInitialized) return;

    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem(AUTH_USER_KEY);
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
        }

        const storedAgency = localStorage.getItem(AGENCY_KEY);
        if (storedAgency) {
          this.agencyData = JSON.parse(storedAgency);
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
      agencyId: DEFAULT_AGENCY_ID,
      email: normalized,
      name: normalized.split("@")[0].replace(".", " "),
      role: "owner",
    };

    this.currentUser = user;
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
    return user;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }

  async getAgency(_agencyId: string = DEFAULT_AGENCY_ID): Promise<Agency> {
    this.init();
    return this.agencyData;
  }

  async updateAgency(
    _agencyId: string = DEFAULT_AGENCY_ID,
    data: Partial<Agency>
  ): Promise<Agency> {
    this.init();
    this.agencyData = {
      ...this.agencyData,
      ...data,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(AGENCY_KEY, JSON.stringify(this.agencyData));
    }
    return this.agencyData;
  }
}

/**
 * Exported singleton. Uses SupabaseAuthService when Supabase env vars are
 * configured; falls back to MockAuthService for local development without
 * a backend.
 */
const hasSupabase =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const authService: IAuthService = hasSupabase
  ? new SupabaseAuthService()
  : new MockAuthService();
