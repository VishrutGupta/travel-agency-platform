export type AgencyRole = "owner" | "admin" | "staff";

export interface Agency {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  logo: string;
  description: string;
  phone: string;
  whatsapp: string; // Configurable number without spaces, e.g. "919876543210"
  email: string;
  address: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  accentColor?: string;
  createdAt: string;
}

export interface User {
  id: string;
  agencyId: string;
  email: string;
  name: string;
  role: AgencyRole;
  username?: string;
  isDisabled?: boolean;
  permissions?: string[];
  createdAt?: string;
}

export interface ItineraryItem {
  day: number;
  title: string;
  description: string;
  stay?: string;
  meals?: string;
  elevation?: string;
}

export type TripType = "Family" | "Trekking" | "Expedition" | "Cultural" | "Relaxed" | "Honeymoon" | "Solo";
export type ExperienceType = "Adventure" | "Relaxed" | "Sightseeing" | "Trekking" | "Wildlife" | "Spiritual";
export type DifficultyLevel = "Easy" | "Moderate" | "Challenging" | "Strenuous";

export interface Trip {
  id: string;
  agencyId: string;
  slug: string;
  title: string;
  destination: string;
  region: "Himalayas" | "Desert" | "Coastal" | "Western Ghats" | "Northeast" | "Central India";
  startDate: string; // ISO date format e.g. "2026-10-15"
  endDate: string;
  duration: number; // Days
  nights: number;
  price: number; // In INR ₹
  originalPrice?: number;
  shortDescription: string;
  description: string;
  imageUrl: string;
  galleryUrls?: string[];
  brochureUrl?: string;
  tripType: TripType;
  experience: ExperienceType;
  difficulty: DifficultyLevel;
  familyFriendly: boolean;
  featured: boolean;
  isActive: boolean;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryItem[];
  importantInfo?: string[];
  maxGroupSize?: number;
  whatsappNumber?: string; // Optional trip-specific override
  createdAt: string;
  updatedAt: string;
}

export interface TripFilter {
  destination?: string;
  month?: string; // e.g. "10", "October"
  duration?: "all" | "short" | "medium" | "long" | "extended"; // 2-3, 4-5, 6-7, 8+
  minDuration?: number;
  maxDuration?: number;
  budget?: "all" | "under20k" | "20k-30k" | "30k-50k" | "above50k";
  minPrice?: number;
  maxPrice?: number;
  tripType?: string;
  experience?: string;
  difficulty?: string;
  familyFriendly?: boolean;
  featuredOnly?: boolean;
}

export interface AssistantChoice {
  label: string;
  value: string;
  icon?: string;
}

export interface AssistantQuestion {
  id: string;
  prompt: string;
  subtitle?: string;
  options: AssistantChoice[];
  conditionalOn?: {
    questionId: string;
    value: string | string[];
  };
}

export interface AssistantUserAnswers {
  destinationCategory?: string; // "mountains" | "beaches" | "desert" | "nature" | "international" | "flexible"
  mountainExperience?: string; // "relaxed" | "adventure" | "sightseeing" | "trekking"
  timing?: string; // "this_month" | "next_month" | "2_3_months" | "flexible"
  duration?: string; // "2-3" | "4-5" | "6-7" | "8+"
  budget?: string; // "under_20k" | "20k-30k" | "30k-50k" | "above_50k"
  travelers?: string; // "solo" | "couple" | "family" | "friends" | "group"
  hasChildren?: string; // "yes" | "no"
}

export interface ChatMessageItem {
  id: string;
  sender: "assistant" | "user";
  text?: string;
  timestamp: string;
  options?: AssistantChoice[];
  questionId?: string;
  trips?: Trip[];
  isRelaxedSearch?: boolean;
  relaxationReason?: string;
  actionSuggestions?: { label: string; action: string }[];
}

export interface AuditLog {
  id: string;
  agencyId: string;
  actorUserId: string;
  actorUsername: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  description: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface IAuthService {
  getCurrentUser(): Promise<User | null>;
  login(username: string, password: string): Promise<User>;
  logout(): Promise<void>;
  signup(email: string, password: string, fullName: string, username: string): Promise<User>;
  forgotPassword(username: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  getAgency(agencyId?: string): Promise<Agency>;
  updateAgency(agencyId: string, updateData: Partial<Agency>): Promise<Agency>;
}
