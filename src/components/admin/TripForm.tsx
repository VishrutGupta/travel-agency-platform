"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trip, TripType, ExperienceType, DifficultyLevel, ItineraryItem } from "@/lib/types";
import { ImageUploader, PdfUploader } from "./FileUploader";
import { Plus, Trash2, ArrowLeft, Save, Sparkles, Check } from "lucide-react";
import Link from "next/link";

interface TripFormProps {
  initialData?: Partial<Trip>;
  onSubmit: (data: any) => Promise<void>;
  isEditing?: boolean;
}

export const TripForm: React.FC<TripFormProps> = ({
  initialData,
  onSubmit,
  isEditing = false,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [destination, setDestination] = useState(initialData?.destination || "Kashmir");
  const [region, setRegion] = useState(initialData?.region || "Himalayas");
  const [startDate, setStartDate] = useState(initialData?.startDate || "2026-10-15");
  const [endDate, setEndDate] = useState(initialData?.endDate || "2026-10-21");
  const [duration, setDuration] = useState(initialData?.duration || 7);
  const [nights, setNights] = useState(initialData?.nights || 6);
  const [price, setPrice] = useState(initialData?.price || 28500);
  const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice || 32000);
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [tripType, setTripType] = useState<TripType>(initialData?.tripType || "Trekking");
  const [experience, setExperience] = useState<ExperienceType>(initialData?.experience || "Adventure");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialData?.difficulty || "Moderate");
  const [familyFriendly, setFamilyFriendly] = useState(initialData?.familyFriendly ?? true);
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [imageUrl, setImageUrl] = useState(
    initialData?.imageUrl ||
      "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80"
  );
  const [brochureUrl, setBrochureUrl] = useState(initialData?.brochureUrl || "");
  const [whatsappNumber, setWhatsappNumber] = useState(initialData?.whatsappNumber || "");
  const [maxGroupSize, setMaxGroupSize] = useState(initialData?.maxGroupSize || 12);

  // Lists
  const [highlights, setHighlights] = useState<string[]>(
    initialData?.highlights || [
      "Stunning alpine camping under starry Karakoram skies",
      "Certified Wilderness First Responder mountain guides",
    ]
  );
  const [inclusions, setInclusions] = useState<string[]>(
    initialData?.inclusions || [
      "All four-season high altitude tents and sleeping bags",
      "Nutritious chef-prepared vegetarian meals",
      "Forest department permits and environmental cess",
    ]
  );
  const [exclusions, setExclusions] = useState<string[]>(
    initialData?.exclusions || [
      "Personal flights/trains to Srinagar",
      "Personal backpack offloading fees",
    ]
  );
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(
    initialData?.itinerary || [
      {
        day: 1,
        title: "Basecamp Arrival & Briefing",
        description: "Scenic mountain drive followed by gear checks and sunset walk.",
        stay: "Alpine Tents",
        meals: "Dinner",
      },
    ]
  );

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  const handleAddHighlight = () => setHighlights([...highlights, ""]);
  const handleUpdateHighlight = (idx: number, text: string) => {
    const arr = [...highlights];
    arr[idx] = text;
    setHighlights(arr);
  };
  const handleRemoveHighlight = (idx: number) => {
    setHighlights(highlights.filter((_, i) => i !== idx));
  };

  const handleAddItinerary = () => {
    setItinerary([
      ...itinerary,
      {
        day: itinerary.length + 1,
        title: "New Day Stage",
        description: "Trail description and milestones.",
        stay: "Mountain Lodge",
        meals: "Breakfast, Dinner",
      },
    ]);
  };

  const handleUpdateItinerary = (idx: number, field: keyof ItineraryItem, val: any) => {
    const arr = [...itinerary];
    arr[idx] = { ...arr[idx], [field]: val };
    setItinerary(arr);
  };

  const handleRemoveItinerary = (idx: number) => {
    setItinerary(itinerary.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!title.trim()) throw new Error("Trip name is required.");
      if (!slug.trim()) throw new Error("Slug identifier is required.");
      if (!imageUrl.trim()) throw new Error("Cover image is required.");

      const payload = {
        title,
        slug,
        destination,
        region,
        startDate,
        endDate,
        duration: Number(duration),
        nights: Number(nights),
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        shortDescription,
        description,
        tripType,
        experience,
        difficulty,
        familyFriendly,
        featured,
        isActive,
        imageUrl,
        brochureUrl,
        whatsappNumber: whatsappNumber || undefined,
        maxGroupSize: Number(maxGroupSize),
        highlights: highlights.filter((h) => h.trim().length > 0),
        inclusions: inclusions.filter((i) => i.trim().length > 0),
        exclusions: exclusions.filter((e) => e.trim().length > 0),
        itinerary,
      };

      await onSubmit(payload);
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/trips");
      }, 900);
    } catch (err: any) {
      setError(err.message || "Failed to save trip.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-4xl pb-16">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/trips"
          className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#1C1E21]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Trips</span>
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-75"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : success ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{loading ? "Saving Trip..." : isEditing ? "Save Changes" : "Create Trip"}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* 1. Basic Trip Information */}
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8 flex flex-col gap-6 shadow-2xs">
        <h3 className="text-sm font-semibold text-[#1C1E21] uppercase tracking-wider border-b border-[#F0EFEA] pb-3">
          1. Basic Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Trip Name *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Kashmir Great Lakes Expedition"
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Slug Identifier (URL) *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. kashmir-great-lakes-trek"
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-mono focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Destination *</label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Kashmir, Himachal Pradesh, Ladakh"
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Geographical Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            >
              <option value="Himalayas">Himalayas</option>
              <option value="Desert">Desert</option>
              <option value="Coastal">Coastal</option>
              <option value="Western Ghats">Western Ghats</option>
              <option value="Northeast">Northeast</option>
              <option value="Central India">Central India</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#374151]">Short Description (Card Teaser)</label>
          <input
            type="text"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="A compelling one-sentence summary for trip cards"
            className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#374151]">Full Expedition Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Full overview of terrain, historical context, and experience"
            className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
          />
        </div>
      </div>

      {/* 2. Schedule, Pricing & Group */}
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8 flex flex-col gap-6 shadow-2xs">
        <h3 className="text-sm font-semibold text-[#1C1E21] uppercase tracking-wider border-b border-[#F0EFEA] pb-3">
          2. Schedule & Pricing
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Duration (Days)</label>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="px-3.5 py-2 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Nights</label>
            <input
              type="number"
              min={0}
              value={nights}
              onChange={(e) => setNights(Number(e.target.value))}
              className="px-3.5 py-2 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Price (INR ₹) *</label>
            <input
              type="number"
              required
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Original / Strikethrough Price</label>
            <input
              type="number"
              min={0}
              value={originalPrice}
              onChange={(e) => setOriginalPrice(Number(e.target.value))}
              placeholder="e.g. 32000"
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Max Group Size</label>
            <input
              type="number"
              min={1}
              value={maxGroupSize}
              onChange={(e) => setMaxGroupSize(Number(e.target.value))}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 3. Classification & Toggles */}
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8 flex flex-col gap-6 shadow-2xs">
        <h3 className="text-sm font-semibold text-[#1C1E21] uppercase tracking-wider border-b border-[#F0EFEA] pb-3">
          3. Classification & Toggles
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Trip Type</label>
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            >
              <option value="Trekking">Trekking</option>
              <option value="Expedition">Expedition</option>
              <option value="Cultural">Cultural</option>
              <option value="Relaxed">Relaxed</option>
              <option value="Family">Family Friendly</option>
              <option value="Solo">Solo</option>
              <option value="Honeymoon">Honeymoon</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Experience Style</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            >
              <option value="Adventure">Adventure</option>
              <option value="Trekking">Trekking</option>
              <option value="Sightseeing">Sightseeing</option>
              <option value="Relaxed">Relaxed</option>
              <option value="Wildlife">Wildlife</option>
              <option value="Spiritual">Spiritual</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            >
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Challenging">Challenging</option>
              <option value="Strenuous">Strenuous</option>
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50 border border-[#E5E0D8] cursor-pointer">
            <input
              type="checkbox"
              checked={familyFriendly}
              onChange={(e) => setFamilyFriendly(e.target.checked)}
              className="w-4 h-4 accent-[#4B6B5B]"
            />
            <span className="text-xs font-semibold text-[#1C1E21]">Family Friendly</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50 border border-[#E5E0D8] cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 accent-[#4B6B5B]"
            />
            <span className="text-xs font-semibold text-[#1C1E21]">Featured on Home</span>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50 border border-[#E5E0D8] cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-[#4B6B5B]"
            />
            <span className="text-xs font-semibold text-[#1C1E21]">
              Status: {isActive ? "Active (Public)" : "Draft (Hidden)"}
            </span>
          </label>
        </div>
      </div>

      {/* 4. Media & Brochure Documents */}
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8 flex flex-col gap-6 shadow-2xs">
        <h3 className="text-sm font-semibold text-[#1C1E21] uppercase tracking-wider border-b border-[#F0EFEA] pb-3">
          4. Media & Documents (Supabase Storage Ready)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            label="Trip Cover Photography *"
          />

          <PdfUploader
            value={brochureUrl}
            onChange={setBrochureUrl}
            label="Brochure PDF Document"
          />
        </div>

        <div className="flex flex-col gap-1.5 pt-2">
          <label className="text-xs font-semibold text-[#374151]">
            WhatsApp Number Override (Optional)
          </label>
          <input
            type="text"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="e.g. 919820045120 (leave blank to use default agency number)"
            className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden max-w-sm"
          />
        </div>
      </div>

      {/* 5. Highlights Builder */}
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8 flex flex-col gap-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-3">
          <h3 className="text-sm font-semibold text-[#1C1E21] uppercase tracking-wider">
            5. Highlights
          </h3>
          <button
            type="button"
            onClick={handleAddHighlight}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-medium text-[#1C1E21]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Point</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {highlights.map((h, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={h}
                onChange={(e) => handleUpdateHighlight(idx, e.target.value)}
                placeholder="e.g. Camp beside high altitude turquoise lakes"
                className="flex-1 px-3.5 py-2 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleRemoveHighlight(idx)}
                className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                title="Remove point"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Day-by-Day Itinerary Builder */}
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8 flex flex-col gap-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-3">
          <h3 className="text-sm font-semibold text-[#1C1E21] uppercase tracking-wider">
            6. Day-by-Day Itinerary ({itinerary.length} Days)
          </h3>
          <button
            type="button"
            onClick={handleAddItinerary}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-medium text-[#1C1E21]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Next Day</span>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {itinerary.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF9F6] flex flex-col gap-3 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1C1E21]">Day {item.day}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItinerary(idx)}
                  className="text-stone-400 hover:text-red-600 p-1"
                  title="Remove this day"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="text"
                value={item.title}
                onChange={(e) => handleUpdateItinerary(idx, "title", e.target.value)}
                placeholder="Day Stage Title (e.g. Shitkadi to Nichnai)"
                className="px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs font-semibold"
              />

              <textarea
                rows={2}
                value={item.description}
                onChange={(e) => handleUpdateItinerary(idx, "description", e.target.value)}
                placeholder="Details of trail distance, terrain, and milestones"
                className="px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={item.stay || ""}
                  onChange={(e) => handleUpdateItinerary(idx, "stay", e.target.value)}
                  placeholder="Accommodation (e.g. Alpine Tents)"
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs"
                />
                <input
                  type="text"
                  value={item.meals || ""}
                  onChange={(e) => handleUpdateItinerary(idx, "meals", e.target.value)}
                  placeholder="Meals (e.g. Breakfast, Lunch, Dinner)"
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs sm:text-sm font-semibold shadow-md transition-all disabled:opacity-75"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{loading ? "Saving..." : isEditing ? "Update Trip" : "Save and Publish Trip"}</span>
        </button>
      </div>
    </form>
  );
};
