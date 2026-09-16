import React from "react";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { Trip } from "@/lib/types";
import { TripCard } from "../trips/TripCard";

interface FeaturedTripsSectionProps {
  featuredTrips: Trip[];
  agencyWhatsApp?: string;
}

export const FeaturedTripsSection: React.FC<FeaturedTripsSectionProps> = ({
  featuredTrips,
  agencyWhatsApp,
}) => {
  return (
    <section className="py-20 sm:py-28 bg-[#FAF9F6] border-b border-[#E5E0D8]/60">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#4B6B5B] mb-2.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Upcoming Departures</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#1C1E21]">
              Featured Expeditions
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#6B7280] font-normal max-w-lg">
              Hand-picked high-altitude crossings and slow explorations scheduled for optimal seasonal weather.
            </p>
          </div>

          <Link
            href="/trips"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1C1E21] hover:text-[#4B6B5B] group transition-colors self-start sm:self-auto"
          >
            <span>View All Trips</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Trips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredTrips.slice(0, 3).map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              agencyWhatsApp={agencyWhatsApp}
            />
          ))}
        </div>

        {/* View All Bottom Bar */}
        <div className="mt-14 text-center">
          <Link
            href="/trips"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#1C1E21] text-white text-xs sm:text-sm font-semibold hover:bg-[#2A3A4A] transition-all hover:scale-[1.02] shadow-sm"
          >
            <span>Explore All Journeys ({featuredTrips.length}+ Available)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
