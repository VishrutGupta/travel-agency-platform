"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Map,
  PlusCircle,
  Eye,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { tripService } from "@/lib/services/tripService";
import { authService } from "@/lib/services/authService";
import { Trip, User, Agency } from "@/lib/types";
import { formatINR, formatDateRange } from "@/lib/utils/cn";

export default function AdminDashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      tripService.getTrips(undefined, true),
      authService.getCurrentUser(),
      authService.getAgency(),
    ]).then(([tripsRes, userRes, agencyRes]) => {
      setTrips(tripsRes);
      setUser(userRes);
      setAgency(agencyRes);
      setLoading(false);
    });
  }, []);

  const activeCount = trips.filter((t) => t.isActive).length;
  const featuredCount = trips.filter((t) => t.featured && t.isActive).length;
  const draftCount = trips.filter((t) => !t.isActive).length;

  const destinationsCount = new Set(trips.map((t) => t.destination)).size;

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#4B6B5B] font-semibold">
            {agency?.name || "Alpine & Co."}
          </span>
          <h1 className="text-3xl sm:text-4xl font-light text-[#1C1E21] tracking-tight mt-1">
            Good morning{user?.name ? `, ${user.name}` : ""}!
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Welcome to your agency command center. Here is your current expedition portfolio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/trips/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1E21] text-white text-xs font-semibold hover:bg-[#2A3A4A] transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Trip</span>
          </Link>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E0D8] text-xs font-medium text-[#1C1E21] hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <span>Live Site</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Overview KPI Cards (Section 25) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {/* Active Trips */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            Active Trips
          </span>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl sm:text-5xl font-light text-[#1C1E21]">
              {activeCount}
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[11px] text-[#6B7280] mt-2">
            Published & bookable
          </span>
        </div>

        {/* Featured Trips */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            Featured Trips
          </span>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl sm:text-5xl font-light text-[#1C1E21]">
              {featuredCount}
            </span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[11px] text-[#6B7280] mt-2">
            Home page spotlight
          </span>
        </div>

        {/* Total Destinations */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            Destinations
          </span>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl sm:text-5xl font-light text-[#1C1E21]">
              {destinationsCount}
            </span>
            <Map className="w-5 h-5 text-[#4B6B5B]" />
          </div>
          <span className="text-[11px] text-[#6B7280] mt-2">
            Active regions covered
          </span>
        </div>

        {/* Draft Trips */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            Draft Trips
          </span>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl sm:text-5xl font-light text-[#1C1E21]">
              {draftCount}
            </span>
            <Calendar className="w-5 h-5 text-stone-400" />
          </div>
          <span className="text-[11px] text-[#6B7280] mt-2">
            Unpublished drafts
          </span>
        </div>
      </div>

      {/* Recent Trips Quick Table */}
      <div className="bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 shadow-2xs flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1C1E21]">
              Recent Journeys
            </h2>
            <p className="text-xs text-[#6B7280]">
              Quick status check on your active expedition portfolio
            </p>
          </div>

          <Link
            href="/admin/trips"
            className="text-xs font-semibold text-[#4B6B5B] hover:underline"
          >
            Manage All ({trips.length}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#F0EFEA] text-[#6B7280] uppercase font-semibold">
                <th className="pb-3 font-semibold">Trip Title</th>
                <th className="pb-3 font-semibold">Destination</th>
                <th className="pb-3 font-semibold">Dates</th>
                <th className="pb-3 font-semibold">Price</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EFEA]">
              {trips.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-stone-50/50">
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={t.imageUrl}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover bg-stone-100 shrink-0"
                      />
                      <span className="font-semibold text-[#1C1E21] line-clamp-1">
                        {t.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-3 text-[#374151]">{t.destination}</td>
                  <td className="py-3.5 pr-3 text-[#6B7280]">
                    {formatDateRange(t.startDate, t.endDate)}
                  </td>
                  <td className="py-3.5 pr-3 font-semibold text-[#1C1E21]">
                    {formatINR(t.price)}
                  </td>
                  <td className="py-3.5 pr-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        t.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {t.isActive ? "Active" : "Draft"}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      href={`/admin/trips/${t.id}/edit`}
                      className="px-2.5 py-1 rounded-lg border border-[#E5E0D8] text-[11px] font-medium text-[#1C1E21] hover:bg-stone-100"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
