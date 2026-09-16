import { AssistantUserAnswers, Trip } from "../types";
import { tripService } from "../services/tripService";
import { DEFAULT_AGENCY_ID } from "../data/mockAgency";

export interface RankedTripResult {
  trip: Trip;
  score: number;
  matchReasons: string[];
}

export interface AssistantSearchResponse {
  results: Trip[];
  rankedResults: RankedTripResult[];
  isRelaxed: boolean;
  relaxationReason?: string;
  totalFound: number;
}

/**
 * Deterministic scoring algorithm:
 * - Destination category match: +5
 * - Budget match: +4
 * - Duration match: +3
 * - Timing/Month match: +3
 * - Experience match: +2
 * - Group/Traveler match: +2
 */
export function scoreTrip(
  trip: Trip,
  answers: AssistantUserAnswers
): { score: number; matchReasons: string[] } {
  let score = 0;
  const matchReasons: string[] = [];

  // 1. Destination Category (+5)
  if (answers.destinationCategory) {
    if (answers.destinationCategory === "mountains") {
      if (trip.region === "Himalayas") {
        score += 5;
        matchReasons.push("Mountain setting match (+5)");
      }
    } else if (answers.destinationCategory === "beaches") {
      if (trip.region === "Coastal") {
        score += 5;
        matchReasons.push("Coastal setting match (+5)");
      }
    } else if (answers.destinationCategory === "desert") {
      if (trip.region === "Desert") {
        score += 5;
        matchReasons.push("Desert heritage match (+5)");
      }
    } else if (answers.destinationCategory === "nature") {
      if (trip.region === "Western Ghats" || trip.region === "Northeast") {
        score += 5;
        matchReasons.push("Rainforest & nature match (+5)");
      }
    } else if (answers.destinationCategory === "flexible") {
      score += 3;
      matchReasons.push("Flexible destination preference (+3)");
    }
  }

  // 2. Mountain Experience (+2)
  if (answers.mountainExperience) {
    if (
      trip.experience.toLowerCase() === answers.mountainExperience.toLowerCase()
    ) {
      score += 2;
      matchReasons.push(`Matches ${answers.mountainExperience} style (+2)`);
    }
  }

  // 3. Timing / Month (+3)
  if (answers.timing) {
    const tripDate = new Date(trip.startDate);
    const tripMonth = tripDate.getMonth() + 1; // 1-12
    if (answers.timing === "this_month" && tripMonth === 10) {
      score += 3;
      matchReasons.push("Matches October departure (+3)");
    } else if (answers.timing === "next_month" && tripMonth === 11) {
      score += 3;
      matchReasons.push("Matches November departure (+3)");
    } else if (answers.timing === "flexible") {
      score += 2;
      matchReasons.push("Flexible date allowance (+2)");
    }
  }

  // 4. Duration (+3)
  if (answers.duration) {
    if (answers.duration === "2-3" && trip.duration >= 2 && trip.duration <= 3) {
      score += 3;
      matchReasons.push("Matches 2–3 day duration (+3)");
    } else if (
      answers.duration === "4-5" &&
      trip.duration >= 4 &&
      trip.duration <= 5
    ) {
      score += 3;
      matchReasons.push("Matches 4–5 day duration (+3)");
    } else if (
      answers.duration === "6-7" &&
      trip.duration >= 6 &&
      trip.duration <= 7
    ) {
      score += 3;
      matchReasons.push("Matches 6–7 day duration (+3)");
    } else if (answers.duration === "8+" && trip.duration >= 8) {
      score += 3;
      matchReasons.push("Matches 8+ day duration (+3)");
    }
  }

  // 5. Budget Match (+4)
  if (answers.budget) {
    if (answers.budget === "under_20k" && trip.price < 20000) {
      score += 4;
      matchReasons.push("Within budget under ₹20K (+4)");
    } else if (
      answers.budget === "20k-30k" &&
      trip.price >= 20000 &&
      trip.price <= 30000
    ) {
      score += 4;
      matchReasons.push("Within budget ₹20K–₹30K (+4)");
    } else if (
      answers.budget === "30k-50k" &&
      trip.price > 30000 &&
      trip.price <= 50000
    ) {
      score += 4;
      matchReasons.push("Within budget ₹30K–₹50K (+4)");
    } else if (answers.budget === "above_50k" && trip.price > 50000) {
      score += 4;
      matchReasons.push("Premium budget tier (+4)");
    }
  }

  // 6. Travelers & Family Friendly (+2)
  if (answers.travelers) {
    if (answers.travelers === "family") {
      if (trip.familyFriendly) {
        score += 2;
        matchReasons.push("Family friendly certified (+2)");
      }
    } else if (answers.travelers === "solo" && trip.tripType === "Solo") {
      score += 2;
      matchReasons.push("Solo traveler oriented (+2)");
    } else {
      score += 1;
    }
  }

  return { score, matchReasons };
}

export async function findMatchingTrips(
  answers: AssistantUserAnswers,
  agencyId: string = DEFAULT_AGENCY_ID
): Promise<AssistantSearchResponse> {
  const allTrips = await tripService.getTrips(agencyId, false);

  if (allTrips.length === 0) {
    return {
      results: [],
      rankedResults: [],
      isRelaxed: false,
      totalFound: 0,
    };
  }

  // 1. Calculate score for all active trips
  const scoredTrips: RankedTripResult[] = allTrips.map((trip) => {
    const { score, matchReasons } = scoreTrip(trip, answers);
    return { trip, score, matchReasons };
  });

  // Sort descending by deterministic score
  scoredTrips.sort((a, b) => b.score - a.score);

  // Exact matches: trips with high score threshold (e.g. >= 9 points)
  const exactMatches = scoredTrips.filter((st) => st.score >= 9);

  if (exactMatches.length > 0) {
    return {
      results: exactMatches.slice(0, 4).map((m) => m.trip),
      rankedResults: exactMatches.slice(0, 4),
      isRelaxed: false,
      totalFound: exactMatches.length,
    };
  }

  // Fallback relaxation if no strict match
  // 1. Relax experience/month constraint, look for score >= 5
  const partialMatches = scoredTrips.filter((st) => st.score >= 5);

  if (partialMatches.length > 0) {
    return {
      results: partialMatches.slice(0, 3).map((m) => m.trip),
      rankedResults: partialMatches.slice(0, 3),
      isRelaxed: true,
      relaxationReason:
        "No departure matched every single constraint exactly, so we relaxed dates and duration slightly to highlight the closest authentic options.",
      totalFound: partialMatches.length,
    };
  }

  // Fallback to top featured expeditions if everything was unaligned
  const fallback = scoredTrips.slice(0, 3);
  return {
    results: fallback.map((m) => m.trip),
    rankedResults: fallback,
    isRelaxed: true,
    relaxationReason:
      "We broadened your search to show our most acclaimed upcoming mountain journeys.",
    totalFound: fallback.length,
  };
}
