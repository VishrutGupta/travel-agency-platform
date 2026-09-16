"use client";

import React from "react";
import { TripForm } from "@/components/admin/TripForm";
import { tripService } from "@/lib/services/tripService";
import { DEFAULT_AGENCY_ID } from "@/lib/data/mockAgency";

export default function AdminNewTripPage() {
  const handleCreate = async (data: any) => {
    await tripService.createTrip(DEFAULT_AGENCY_ID, data);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#1C1E21] tracking-tight">
          Create New Journey
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
          Add an upcoming small-group expedition to your catalog.
        </p>
      </div>

      <TripForm onSubmit={handleCreate} isEditing={false} />
    </div>
  );
}
