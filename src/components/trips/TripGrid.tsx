import React from "react";
import { Trip } from "@/lib/types";
import { TripCard } from "./TripCard";
import { Compass, RotateCcw } from "lucide-react";

interface TripGridProps {
  trips: Trip[];
  loading?: boolean;
  agencyWhatsApp?: string;
  onResetFilters?: () => void;
}

export const TripGrid: React.FC<TripGridProps> = ({
  trips,
  loading = false,
  agencyWhatsApp,
  onResetFilters,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[#E5E0D8]/60 bg-white overflow-hidden p-0 animate-pulse"
          >
            <div className="h-56 bg-stone-200/80" />
            <div className="p-5 flex flex-col gap-3">
              <div className="h-4 bg-stone-200/80 rounded-sm w-1/3" />
              <div className="h-6 bg-stone-200/80 rounded-sm w-3/4" />
              <div className="h-4 bg-stone-200/60 rounded-sm w-full" />
              <div className="h-4 bg-stone-200/60 rounded-sm w-2/3" />
              <div className="pt-4 flex items-center justify-between">
                <div className="h-5 bg-stone-200/80 rounded-sm w-1/4" />
                <div className="h-9 bg-stone-200/80 rounded-xl w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="w-full py-16 px-6 text-center rounded-3xl bg-[#F5F4F0] border border-[#E5E0D8] flex flex-col items-center justify-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-white text-[#4B6B5B] flex items-center justify-center shadow-xs mb-4">
          <Compass className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-medium text-[#1C1E21] mb-2">
          No matching journeys found
        </h3>
        <p className="text-sm text-[#6B7280] max-w-xs mb-6 leading-relaxed">
          We couldn't find any trips matching your exact filters. Try broadening your dates, budget, or destination.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1E21] text-white text-xs font-semibold hover:bg-[#2A3A4A] transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {trips.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          agencyWhatsApp={agencyWhatsApp}
        />
      ))}
    </div>
  );
};
