"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  FileText,
  ShieldCheck,
  Check,
  X as XIcon,
  ChevronRight,
  Mountain,
  Users,
  Compass,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TravelAssistant } from "@/components/chatbot/TravelAssistant";
import { BrochureModal } from "@/components/trips/BrochureModal";
import { tripService } from "@/lib/services/tripService";
import { authService } from "@/lib/services/authService";
import { Trip, Agency } from "@/lib/types";
import { formatINR, formatDateRange } from "@/lib/utils/cn";
import { buildTripWhatsAppInquiry } from "@/lib/utils/whatsapp";

export default function TripDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [brochureOpen, setBrochureOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"itinerary" | "inclusions" | "info">("itinerary");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    tripService.getTripBySlug(agency?.id || "agency_alpine_expeditions", slug).then((res) => {
      setTrip(res);
      setLoading(false);
    });
    authService.getAgency().then(setAgency);
  }, [slug, agency?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1C1E21] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#6B7280]">Loading journey details...</span>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md mx-auto text-center py-32 px-6">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-[#4B6B5B] flex items-center justify-center mx-auto mb-4">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-light text-[#1C1E21] mb-2">
            Trip Not Found
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">
            The requested journey may have concluded or been relocated.
          </p>
          <Link
            href="/trips"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1C1E21] text-white text-xs font-semibold shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse All Journeys</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const dateStr = formatDateRange(trip.startDate, trip.endDate);
  const targetWhatsApp = trip.whatsappNumber || agency?.whatsapp || "919820045120";
  const whatsappUrl = buildTripWhatsAppInquiry(trip.title, dateStr, targetWhatsApp);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1E21] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20 sm:pb-28">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          {/* Breadcrumb back navigation */}
          <div className="mb-6 flex items-center gap-2 text-xs text-[#6B7280]">
            <Link
              href="/trips"
              className="inline-flex items-center gap-1.5 hover:text-[#1C1E21] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Journeys</span>
            </Link>
            <span>/</span>
            <span className="text-[#1C1E21] font-medium truncate">
              {trip.title}
            </span>
          </div>

          {/* Hero Media Container */}
          <div className="relative rounded-3xl overflow-hidden bg-stone-200 border border-[#E5E0D8] h-[360px] sm:h-[480px] lg:h-[520px] mb-8 shadow-xs">
            <img
              src={trip.imageUrl}
              alt={trip.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Badges Over Image */}
            <div className="absolute top-6 left-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-semibold text-[#1C1E21] uppercase tracking-wider shadow-xs">
                {trip.destination}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#1C1E21]/80 backdrop-blur-md text-xs font-medium text-white shadow-xs">
                {trip.tripType}
              </span>
              {trip.featured && (
                <span className="px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-xs font-semibold shadow-xs">
                  ★ Featured
                </span>
              )}
            </div>

            {/* Bottom Title & Quick Meta on Banner */}
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 text-white">
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-200 mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-300" />
                  <span>{trip.duration} Days • {trip.nights} Nights</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-300" />
                  <span>{dateStr}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Mountain className="w-4 h-4 text-sky-300" />
                  <span>Level: {trip.difficulty}</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-white leading-tight max-w-3xl">
                {trip.title}
              </h1>
            </div>
          </div>

          {/* Main Content Layout: Left details (8 cols) + Right sticky booking/inquiry card (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Column (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-10">
              {/* Short Overview Description */}
              <section className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-[#1C1E21] mb-3">
                  About the Journey
                </h2>
                <p className="text-sm sm:text-base text-[#4A5568] leading-relaxed font-normal mb-6">
                  {trip.description}
                </p>

                {/* Key Meta Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#F0EFEA] text-xs">
                  <div>
                    <span className="text-[#6B7280] block mb-0.5">Region</span>
                    <span className="font-semibold text-[#1C1E21]">{trip.region}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block mb-0.5">Group Size</span>
                    <span className="font-semibold text-[#1C1E21]">Max {trip.maxGroupSize || 12} guests</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block mb-0.5">Experience</span>
                    <span className="font-semibold text-[#1C1E21]">{trip.experience}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block mb-0.5">Family Friendly</span>
                    <span className="font-semibold text-[#1C1E21]">{trip.familyFriendly ? "Yes" : "Challenging"}</span>
                  </div>
                </div>
              </section>

              {/* Trip Highlights */}
              <section className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-[#1C1E21] mb-4">
                  Trip Highlights
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {trip.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-[#374151]">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-[#4B6B5B] flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        ✓
                      </div>
                      <span className="leading-snug">{h}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Day-by-Day Itinerary */}
              <section className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1C1E21]">
                      Detailed Itinerary
                    </h2>
                    <p className="text-xs text-[#6B7280]">
                      {trip.duration} days of carefully paced progression and acclimatization.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-stone-100 text-[#4B6B5B]">
                    {trip.duration} Days
                  </span>
                </div>

                <div className="relative pl-6 sm:pl-8 border-l-2 border-[#E5E0D8] flex flex-col gap-8">
                  {trip.itinerary.map((item) => (
                    <div key={item.day} className="relative group">
                      {/* Timeline marker */}
                      <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full bg-[#1C1E21] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                        {item.day}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm sm:text-base font-semibold text-[#1C1E21]">
                            {item.title}
                          </h3>
                          {item.elevation && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                              {item.elevation}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                          {item.description}
                        </p>

                        {(item.stay || item.meals) && (
                          <div className="flex flex-wrap gap-4 pt-2 text-[11px] text-[#6B7280]">
                            {item.stay && (
                              <span>
                                <strong className="text-[#374151]">Stay:</strong> {item.stay}
                              </span>
                            )}
                            {item.meals && (
                              <span>
                                <strong className="text-[#374151]">Meals:</strong> {item.meals}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Inclusions & Exclusions */}
              <section className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-[#1C1E21] mb-6">
                  What's Included & Excluded
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* Inclusions */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-[#4B6B5B] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>What's Included</span>
                    </h3>
                    <ul className="flex flex-col gap-2.5">
                      {trip.inclusions.map((inc, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-[#374151]">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Exclusions */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-[#9CA3AF] flex items-center gap-1.5">
                      <XIcon className="w-4 h-4 text-stone-400" />
                      <span>What's Excluded</span>
                    </h3>
                    <ul className="flex flex-col gap-2.5">
                      {trip.exclusions.map((exc, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-[#6B7280]">
                          <XIcon className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                          <span>{exc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Important Information */}
              {trip.importantInfo && trip.importantInfo.length > 0 && (
                <section className="bg-[#FAF9F6] rounded-2xl border border-[#E5E0D8] p-6 sm:p-8">
                  <h2 className="text-base font-semibold text-[#1C1E21] mb-3">
                    Important Travel Information
                  </h2>
                  <ul className="flex flex-col gap-2 text-xs sm:text-sm text-[#4A5568]">
                    {trip.importantInfo.map((info, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#4B6B5B] font-bold">•</span>
                        <span>{info}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Right Sticky Booking / Inquiry Card (4 cols) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-4">
              <div className="bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 shadow-sm">
                <span className="text-[11px] uppercase tracking-wider text-[#6B7280] font-medium block">
                  Price per Explorer
                </span>
                <div className="flex items-baseline gap-2 mt-1 mb-4">
                  <span className="text-3xl font-semibold text-[#1C1E21]">
                    {formatINR(trip.price)}
                  </span>
                  {trip.originalPrice && (
                    <span className="text-sm text-[#9CA3AF] line-through">
                      {formatINR(trip.originalPrice)}
                    </span>
                  )}
                  <span className="text-xs text-[#6B7280]">/ person</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E0D8] text-xs text-[#4A5568] flex flex-col gap-2 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Departure Date:</span>
                    <span className="font-semibold text-[#1C1E21]">{trip.startDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Return Date:</span>
                    <span className="font-semibold text-[#1C1E21]">{trip.endDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Availability:</span>
                    <span className="font-semibold text-emerald-700">Open for Bookings</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {/* WhatsApp Inquiry Button */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquire on WhatsApp</span>
                  </a>

                  {/* Download Brochure Button */}
                  <button
                    type="button"
                    onClick={() => setBrochureOpen(true)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-white border border-[#E5E0D8] hover:bg-[#FAF9F6] text-[#1C1E21] text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-2xs"
                  >
                    <FileText className="w-4 h-4 text-[#4B6B5B]" />
                    <span>Download Brochure PDF</span>
                  </button>
                </div>

                <p className="mt-4 text-[11px] text-[#9CA3AF] text-center leading-normal">
                  Pre-filled WhatsApp message will automatically include departure dates and trip title.
                </p>
              </div>

              {/* Safety guarantee badge */}
              <div className="p-4 rounded-2xl bg-[#F5F4F0] border border-[#EAE7E0] flex items-center gap-3 text-xs text-[#4A5568]">
                <ShieldCheck className="w-5 h-5 text-[#4B6B5B] shrink-0" />
                <span>
                  100% Certified Wilderness Leaders, oxygen kits, and environmental permits included.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <TravelAssistant />

      {/* Brochure Modal */}
      <BrochureModal
        isOpen={brochureOpen}
        onClose={() => setBrochureOpen(false)}
        trip={trip}
      />
    </div>
  );
}
