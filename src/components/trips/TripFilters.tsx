"use client";

import React, { useState } from "react";
import { Filter, X, RotateCcw, SlidersHorizontal } from "lucide-react";
import { TripFilter } from "@/lib/types";

interface TripFiltersProps {
  filters: TripFilter;
  onChange: (filters: TripFilter) => void;
  availableDestinations: string[];
  totalResults: number;
}

export const TripFilters: React.FC<TripFiltersProps> = ({
  filters,
  onChange,
  availableDestinations,
  totalResults,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const activeFilterCount = [
    filters.destination && filters.destination !== "all",
    filters.month && filters.month !== "all",
    filters.duration && filters.duration !== "all",
    filters.budget && filters.budget !== "all",
    filters.tripType && filters.tripType !== "all",
  ].filter(Boolean).length;

  const handleReset = () => {
    onChange({
      destination: "all",
      month: "all",
      duration: "all",
      budget: "all",
      tripType: "all",
    });
  };

  const updateFilter = (key: keyof TripFilter, value: any) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const renderFilterControls = (isMobile = false) => (
    <div className={isMobile ? "flex flex-col gap-4" : "flex flex-wrap items-center gap-3"}>
      {/* Destination */}
      <div className={isMobile ? "flex flex-col gap-1.5" : ""}>
        {isMobile && <label className="text-xs font-semibold text-[#374151]">Destination</label>}
        <select
          value={filters.destination || "all"}
          onChange={(e) => updateFilter("destination", e.target.value)}
          className="h-10 px-3.5 py-1.5 rounded-xl border border-[#E5E0D8] bg-white text-xs sm:text-sm font-medium text-[#1C1E21] hover:border-[#CBD5E1] focus:outline-hidden focus:ring-2 focus:ring-[#4B6B5B]/20 transition-all cursor-pointer shadow-2xs"
          aria-label="Filter by destination"
        >
          <option value="all">Destination: All</option>
          {availableDestinations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Month */}
      <div className={isMobile ? "flex flex-col gap-1.5" : ""}>
        {isMobile && <label className="text-xs font-semibold text-[#374151]">Departure Month</label>}
        <select
          value={filters.month || "all"}
          onChange={(e) => updateFilter("month", e.target.value)}
          className="h-10 px-3.5 py-1.5 rounded-xl border border-[#E5E0D8] bg-white text-xs sm:text-sm font-medium text-[#1C1E21] hover:border-[#CBD5E1] focus:outline-hidden focus:ring-2 focus:ring-[#4B6B5B]/20 transition-all cursor-pointer shadow-2xs"
          aria-label="Filter by month"
        >
          <option value="all">Month: All</option>
          <option value="10">October 2026</option>
          <option value="11">November 2026</option>
          <option value="12">December 2026</option>
        </select>
      </div>

      {/* Duration */}
      <div className={isMobile ? "flex flex-col gap-1.5" : ""}>
        {isMobile && <label className="text-xs font-semibold text-[#374151]">Trip Duration</label>}
        <select
          value={filters.duration || "all"}
          onChange={(e) => updateFilter("duration", e.target.value)}
          className="h-10 px-3.5 py-1.5 rounded-xl border border-[#E5E0D8] bg-white text-xs sm:text-sm font-medium text-[#1C1E21] hover:border-[#CBD5E1] focus:outline-hidden focus:ring-2 focus:ring-[#4B6B5B]/20 transition-all cursor-pointer shadow-2xs"
          aria-label="Filter by duration"
        >
          <option value="all">Duration: All</option>
          <option value="short">2–3 Days (Weekend)</option>
          <option value="medium">4–5 Days (Expedition)</option>
          <option value="long">6–7 Days (Full Trek)</option>
          <option value="extended">8+ Days (Grand Circuit)</option>
        </select>
      </div>

      {/* Budget */}
      <div className={isMobile ? "flex flex-col gap-1.5" : ""}>
        {isMobile && <label className="text-xs font-semibold text-[#374151]">Budget per Person</label>}
        <select
          value={filters.budget || "all"}
          onChange={(e) => updateFilter("budget", e.target.value)}
          className="h-10 px-3.5 py-1.5 rounded-xl border border-[#E5E0D8] bg-white text-xs sm:text-sm font-medium text-[#1C1E21] hover:border-[#CBD5E1] focus:outline-hidden focus:ring-2 focus:ring-[#4B6B5B]/20 transition-all cursor-pointer shadow-2xs"
          aria-label="Filter by budget"
        >
          <option value="all">Budget: All</option>
          <option value="under20k">Under ₹20,000</option>
          <option value="20k-30k">₹20,000 – ₹30,000</option>
          <option value="30k-50k">₹30,000 – ₹50,000</option>
          <option value="above50k">Above ₹50,000</option>
        </select>
      </div>

      {/* Trip Type */}
      <div className={isMobile ? "flex flex-col gap-1.5" : ""}>
        {isMobile && <label className="text-xs font-semibold text-[#374151]">Travel Style</label>}
        <select
          value={filters.tripType || "all"}
          onChange={(e) => updateFilter("tripType", e.target.value)}
          className="h-10 px-3.5 py-1.5 rounded-xl border border-[#E5E0D8] bg-white text-xs sm:text-sm font-medium text-[#1C1E21] hover:border-[#CBD5E1] focus:outline-hidden focus:ring-2 focus:ring-[#4B6B5B]/20 transition-all cursor-pointer shadow-2xs"
          aria-label="Filter by trip style"
        >
          <option value="all">Style: All</option>
          <option value="Trekking">Trekking</option>
          <option value="Expedition">Expedition</option>
          <option value="Cultural">Cultural</option>
          <option value="Relaxed">Relaxed</option>
          <option value="Family">Family Friendly</option>
          <option value="Solo">Solo Traveler</option>
        </select>
      </div>

      {/* Reset button */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#6B7280] hover:text-[#1C1E21] transition-colors"
          title="Clear all filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {/* Desktop Filter Bar */}
      <div className="hidden md:flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F5F4F0] border border-[#EAE7E0]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-[#4B6B5B]" />
          <span>Filters:</span>
        </div>
        {renderFilterControls(false)}
        <div className="text-xs font-medium text-[#6B7280] whitespace-nowrap">
          Showing <span className="font-semibold text-[#1C1E21]">{totalResults}</span> journeys
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="flex md:hidden items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5F4F0] border border-[#EAE7E0] text-xs font-semibold text-[#1C1E21]"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#4B6B5B]" />
          <span>Filter Journeys</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#1C1E21] text-white text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        <span className="text-xs text-[#6B7280]">
          {totalResults} {totalResults === 1 ? "trip" : "trips"}
        </span>
      </div>

      {/* Mobile Filter Modal / Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-xs flex items-end animate-fade-in">
          <div className="w-full bg-[#FAF9F6] rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#4B6B5B]" />
                <h3 className="text-base font-semibold text-[#1C1E21]">
                  Filter Journeys
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-full text-[#6B7280] hover:text-[#1C1E21]"
                aria-label="Close filters modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderFilterControls(true)}

            <div className="pt-4 border-t border-[#E5E0D8] flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-xl border border-[#E5E0D8] text-xs font-semibold text-[#6B7280] hover:text-[#1C1E21]"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 py-3 rounded-xl bg-[#1C1E21] text-white text-xs font-semibold shadow-xs"
              >
                Apply ({totalResults})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
