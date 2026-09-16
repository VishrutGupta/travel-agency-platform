import { mockTrips } from "../data/mockTrips";
import { DEFAULT_AGENCY_ID } from "../data/mockAgency";
import { Trip, TripFilter } from "../types";

export interface ITripService {
  getTrips(agencyId?: string, includeInactive?: boolean): Promise<Trip[]>;
  getTripBySlug(agencyId?: string, slug?: string): Promise<Trip | null>;
  getTripById(agencyId?: string, id?: string): Promise<Trip | null>;
  getFeaturedTrips(agencyId?: string): Promise<Trip[]>;
  getDestinations(agencyId?: string): Promise<string[]>;
  searchTrips(agencyId?: string, filters?: TripFilter): Promise<Trip[]>;
  createTrip(
    agencyId: string,
    data: Omit<Trip, "id" | "agencyId" | "createdAt" | "updatedAt">
  ): Promise<Trip>;
  updateTrip(agencyId: string, id: string, data: Partial<Trip>): Promise<Trip>;
  deleteTrip(agencyId: string, id: string): Promise<boolean>;
  toggleTripStatus(agencyId: string, id: string): Promise<Trip>;
}

const STORAGE_KEY = "alpine_trips_data_v1";

class MockTripService implements ITripService {
  private trips: Trip[] = [];
  private isInitialized = false;

  private init() {
    if (this.isInitialized) return;

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.trips = parsed;
            this.isInitialized = true;
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to load trips from localStorage, fallback to memory", e);
      }
    }

    // Default seed
    this.trips = [...mockTrips];
    this.saveToStorage();
    this.isInitialized = true;
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.trips));
      } catch (e) {
        console.warn("Failed to persist trips to localStorage", e);
      }
    }
  }

  async getTrips(
    agencyId: string = DEFAULT_AGENCY_ID,
    includeInactive = false
  ): Promise<Trip[]> {
    this.init();
    return this.trips.filter((t) => {
      const matchesAgency = !agencyId || t.agencyId === agencyId;
      const matchesStatus = includeInactive ? true : t.isActive;
      return matchesAgency && matchesStatus;
    });
  }

  async getTripBySlug(
    agencyId: string = DEFAULT_AGENCY_ID,
    slug: string = ""
  ): Promise<Trip | null> {
    this.init();
    const trip = this.trips.find(
      (t) => t.slug.toLowerCase() === slug.toLowerCase() && t.agencyId === agencyId
    );
    return trip || null;
  }

  async getTripById(
    agencyId: string = DEFAULT_AGENCY_ID,
    id: string = ""
  ): Promise<Trip | null> {
    this.init();
    const trip = this.trips.find((t) => t.id === id && t.agencyId === agencyId);
    return trip || null;
  }

  async getFeaturedTrips(agencyId: string = DEFAULT_AGENCY_ID): Promise<Trip[]> {
    this.init();
    return this.trips.filter(
      (t) => t.agencyId === agencyId && t.isActive && t.featured
    );
  }

  async getDestinations(agencyId: string = DEFAULT_AGENCY_ID): Promise<string[]> {
    this.init();
    const trips = await this.getTrips(agencyId, false);
    const destSet = new Set<string>();
    trips.forEach((t) => destSet.add(t.destination));
    return Array.from(destSet);
  }

  async searchTrips(
    agencyId: string = DEFAULT_AGENCY_ID,
    filters: TripFilter = {}
  ): Promise<Trip[]> {
    this.init();
    let result = await this.getTrips(agencyId, false);

    if (filters.destination && filters.destination !== "all") {
      const d = filters.destination.toLowerCase();
      result = result.filter((t) =>
        t.destination.toLowerCase().includes(d) ||
        t.title.toLowerCase().includes(d) ||
        t.region.toLowerCase().includes(d)
      );
    }

    if (filters.month && filters.month !== "all") {
      result = result.filter((t) => {
        const tripMonth = new Date(t.startDate).getMonth() + 1;
        const targetMonth = parseInt(filters.month!, 10);
        return tripMonth === targetMonth;
      });
    }

    if (filters.minDuration !== undefined) {
      result = result.filter((t) => t.duration >= filters.minDuration!);
    }
    if (filters.maxDuration !== undefined) {
      result = result.filter((t) => t.duration <= filters.maxDuration!);
    }

    if (filters.duration && filters.duration !== "all") {
      if (filters.duration === "short") {
        result = result.filter((t) => t.duration >= 2 && t.duration <= 3);
      } else if (filters.duration === "medium") {
        result = result.filter((t) => t.duration >= 4 && t.duration <= 5);
      } else if (filters.duration === "long") {
        result = result.filter((t) => t.duration >= 6 && t.duration <= 7);
      } else if (filters.duration === "extended") {
        result = result.filter((t) => t.duration >= 8);
      }
    }

    if (filters.minPrice !== undefined) {
      result = result.filter((t) => t.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((t) => t.price <= filters.maxPrice!);
    }

    if (filters.budget && filters.budget !== "all") {
      if (filters.budget === "under20k") {
        result = result.filter((t) => t.price < 20000);
      } else if (filters.budget === "20k-30k") {
        result = result.filter((t) => t.price >= 20000 && t.price <= 30000);
      } else if (filters.budget === "30k-50k") {
        result = result.filter((t) => t.price > 30000 && t.price <= 50000);
      } else if (filters.budget === "above50k") {
        result = result.filter((t) => t.price > 50000);
      }
    }

    if (filters.tripType && filters.tripType !== "all") {
      result = result.filter(
        (t) => t.tripType.toLowerCase() === filters.tripType!.toLowerCase()
      );
    }

    if (filters.experience && filters.experience !== "all") {
      result = result.filter(
        (t) => t.experience.toLowerCase() === filters.experience!.toLowerCase()
      );
    }

    if (filters.difficulty && filters.difficulty !== "all") {
      result = result.filter(
        (t) => t.difficulty.toLowerCase() === filters.difficulty!.toLowerCase()
      );
    }

    if (filters.familyFriendly !== undefined) {
      result = result.filter((t) => t.familyFriendly === filters.familyFriendly);
    }

    if (filters.featuredOnly) {
      result = result.filter((t) => t.featured);
    }

    return result;
  }

  async createTrip(
    agencyId: string = DEFAULT_AGENCY_ID,
    data: Omit<Trip, "id" | "agencyId" | "createdAt" | "updatedAt">
  ): Promise<Trip> {
    this.init();
    const now = new Date().toISOString();
    const newTrip: Trip = {
      ...data,
      id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      agencyId,
      createdAt: now,
      updatedAt: now,
    };

    this.trips.unshift(newTrip);
    this.saveToStorage();
    return newTrip;
  }

  async updateTrip(
    agencyId: string = DEFAULT_AGENCY_ID,
    id: string,
    data: Partial<Trip>
  ): Promise<Trip> {
    this.init();
    const index = this.trips.findIndex((t) => t.id === id && t.agencyId === agencyId);
    if (index === -1) {
      throw new Error(`Trip with id ${id} not found.`);
    }

    const updatedTrip: Trip = {
      ...this.trips[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.trips[index] = updatedTrip;
    this.saveToStorage();
    return updatedTrip;
  }

  async deleteTrip(
    agencyId: string = DEFAULT_AGENCY_ID,
    id: string
  ): Promise<boolean> {
    this.init();
    const initialLen = this.trips.length;
    this.trips = this.trips.filter((t) => !(t.id === id && t.agencyId === agencyId));
    const deleted = this.trips.length < initialLen;
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  async toggleTripStatus(
    agencyId: string = DEFAULT_AGENCY_ID,
    id: string
  ): Promise<Trip> {
    this.init();
    const trip = await this.getTripById(agencyId, id);
    if (!trip) throw new Error("Trip not found");
    return this.updateTrip(agencyId, id, { isActive: !trip.isActive });
  }
}

// Singleton instance ready to be replaced with SupabaseTripService in the future
export const tripService: ITripService = new SupabaseTripService(undefined as any);
