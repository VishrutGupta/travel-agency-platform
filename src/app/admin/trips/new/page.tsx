"use client";

import React from "react";
import { TripForm } from "@/components/admin/TripForm";

export default function AdminNewTripPage() {
  const handleCreate = async (data: any) => {
    const res = await fetch("/api/admin/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to create trip" }));
      throw new Error(err.error || "Failed to create trip");
    }
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
