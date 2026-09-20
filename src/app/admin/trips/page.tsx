"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  ExternalLink,
  Search,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { tripService } from "@/lib/services/tripService";
import { Trip } from "@/lib/types";
import { formatINR, formatDateRange } from "@/lib/utils/cn";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTrips = async () => {
    setLoading(true);
    const data = await tripService.getTrips(undefined, true);
    setTrips(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleToggleStatus = async (trip: Trip) => {
    const res = await fetch(`/api/admin/trips/${trip.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !trip.isActive }),
    });
    if (res.ok) fetchTrips();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/admin/trips/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteTarget(null);
    fetchTrips();
  };

  const filteredTrips = trips.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      t.tripType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#1C1E21] tracking-tight">
            Trip Management
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Manage your expedition catalog, publishing states, and brochure links.
          </p>
        </div>

        <Link
          href="/admin/trips/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C1E21] text-white text-xs font-semibold hover:bg-[#2A3A4A] transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Trip</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by trip, destination, or style..."
            className="w-full pl-10 pr-4 py-1.5 rounded-xl border border-[#E5E0D8] text-xs font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
          />
        </div>

        <div className="text-xs text-[#6B7280]">
          Total: <span className="font-semibold text-[#1C1E21]">{filteredTrips.length}</span> trips
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-3xl border border-[#E5E0D8] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#E5E0D8] text-[#6B7280] uppercase font-semibold">
                <th className="py-3.5 px-5">Trip</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-4">Dates</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Featured</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA]">
              {filteredTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-stone-50/60 transition-colors">
                  {/* Trip image & title */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={trip.imageUrl}
                        alt=""
                        className="w-11 h-11 rounded-xl object-cover bg-stone-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/trips/${trip.slug}`}
                          target="_blank"
                          className="font-semibold text-[#1C1E21] hover:text-[#4B6B5B] line-clamp-1 block"
                        >
                          {trip.title}
                        </Link>
                        <span className="text-[11px] text-[#6B7280]">
                          {trip.duration} Days • {trip.tripType}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Destination */}
                  <td className="py-4 px-4 font-medium text-[#374151]">
                    {trip.destination}
                  </td>

                  {/* Dates */}
                  <td className="py-4 px-4 text-[#6B7280] whitespace-nowrap">
                    {formatDateRange(trip.startDate, trip.endDate)}
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4 font-semibold text-[#1C1E21]">
                    {formatINR(trip.price)}
                  </td>

                  {/* Featured */}
                  <td className="py-4 px-4">
                    {trip.featured ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                        <Sparkles className="w-3 h-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(trip)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                        trip.isActive
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                      title="Click to toggle Active / Draft"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          trip.isActive ? "bg-emerald-600" : "bg-stone-400"
                        }`}
                      />
                      <span>{trip.isActive ? "Active" : "Draft"}</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/trips/${trip.id}/edit`}
                        className="p-1.5 rounded-lg border border-[#E5E0D8] text-[#1C1E21] hover:bg-stone-100 transition-colors"
                        title="Edit trip"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(trip)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete trip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        tripTitle={deleteTarget?.title || ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </div>
  );
}
