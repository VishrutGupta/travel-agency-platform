"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TripFilters } from "@/components/trips/TripFilters";
import { TripGrid } from "@/components/trips/TripGrid";
import { TravelAssistant } from "@/components/chatbot/TravelAssistant";
import { tripService } from "@/lib/services/tripService";
import { authService } from "@/lib/services/authService";
import { Trip, TripFilter, Agency } from "@/lib/types";
import { Compass } from "lucide-react";

function TripsContent() {
  const searchParams = useSearchParams();
  const initialDest = searchParams.get("destination") || "all";

  const [filters, setFilters] = useState<TripFilter>({
    destination: initialDest,
    month: "all",
    duration: "all",
    budget: "all",
    tripType: "all",
  });

  const [trips, setTrips] = useState<Trip[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync initial query param
  useEffect(() => {
    const dest = searchParams.get("destination");
    if (dest) {
      setFilters((prev) => ({ ...prev, destination: dest }));
    }
  }, [searchParams]);

  useEffect(() => {
    tripService.getDestinations().then(setDestinations);
    authService.getAgency().then(setAgency);
  }, []);

  useEffect(() => {
    setLoading(true);
    tripService.searchTrips(agency?.id, filters).then((res) => {
      setTrips(res);
      setLoading(false);
    });
  }, [filters, agency?.id]);

  const handleResetFilters = () => {
    setFilters({
      destination: "all",
      month: "all",
      duration: "all",
      budget: "all",
      tripType: "all",
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1E21] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 sm:pb-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          {/* Header */}
          <div className="max-w-2xl mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#4B6B5B] mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Expedition Catalog</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-[#1C1E21]">
              Upcoming Journeys
            </h1>
            <p className="mt-3 text-base sm:text-lg text-[#6B7280] font-normal leading-relaxed">
              Find your next adventure. Small-group departures led by certified mountain leaders with all permits and camping gear included.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-10">
            <TripFilters
              filters={filters}
              onChange={setFilters}
              availableDestinations={destinations}
              totalResults={trips.length}
            />
          </div>

          {/* Grid */}
          <TripGrid
            trips={trips}
            loading={loading}
            agencyWhatsApp={agency?.whatsapp}
            onResetFilters={handleResetFilters}
          />
        </div>
      </main>

      <Footer />
      <TravelAssistant />
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#1C1E21] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TripsContent />
    </Suspense>
  );
}
