import { Agency } from "../types";

export const DEFAULT_AGENCY_ID = "agency_alpine_expeditions";

export const mockAgency: Agency = {
  id: DEFAULT_AGENCY_ID,
  name: "Alpine & Co. Expeditions",
  tagline: "Curated Mountain Journeys & High-Altitude Exploration",
  logo: "🏔️",
  description:
    "We are a boutique mountain expedition and adventure agency dedicated to mindful high-altitude treks, immersive cultural journeys, and off-the-grid travel across the Himalayas and India's wild terrains.",
  phone: "+91 98200 45120",
  whatsapp: "919820045120", // Default Indian WhatsApp number format
  email: "hello@alpine-expeditions.com",
  address: "42 High Ridge Sanctuary, Old Manali Road, Manali, Himachal Pradesh 175131, India",
  instagram: "https://instagram.com/alpine_expeditions",
  facebook: "https://facebook.com/alpineexpeditions",
  website: "https://alpine-expeditions.com",
  accentColor: "#4B6B5B",
  createdAt: "2024-01-01T00:00:00.000Z",
};
