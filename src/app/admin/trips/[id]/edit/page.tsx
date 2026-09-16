"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TripForm } from "@/components/admin/TripForm";
import { tripService } from "@/lib/services/tripService";
import { DEFAULT_AGENCY_ID } from "@/lib/data/mockAgency";
import { Trip } from "@/lib/types";

export default function AdminEditTripPage() {
  const params = useParams();
  const tripId = params?.id as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;
    tripService.getTripById(DEFAULT_AGENCY_ID, tripId).then((t) => {
      setTrip(t);
      setLoading(false);
    });
  }, [tripId]);

  const handleUpdate = async (data: any) => {
    if (!trip) return;
    await tripService.updateTrip(DEFAULT_AGENCY_ID, trip.id, data);
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1C1E21] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-20 text-center text-sm text-[#6B7280]">
        Trip not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#1C1E21] tracking-tight">
          Edit Journey
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
          Modify itinerary, pricing, departure dates, or brochure files for "{trip.title}".
        </p>
      </div>

      <TripForm initialData={trip} onSubmit={handleUpdate} isEditing={true} />
    </div>
  );
}
