"use client";

import React, { useState } from "react";
import { FileText, Download, Check, X, Printer, ShieldCheck } from "lucide-react";
import { Trip } from "@/lib/types";

interface BrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

export const BrochureModal: React.FC<BrochureModalProps> = ({
  isOpen,
  onClose,
  trip,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);

      // Create simulated downloadable text/blob if real PDF isn't hosted
      const content = `
======================================================
ALPINE & CO. EXPEDITIONS — TRIP BROCHURE
======================================================
Trip: ${trip.title}
Destination: ${trip.destination} (${trip.region})
Duration: ${trip.duration} Days (${trip.nights} Nights)
Dates: ${trip.startDate} to ${trip.endDate}
Price per Person: ₹${trip.price.toLocaleString("en-IN")}
Trip Style: ${trip.tripType} | Experience: ${trip.experience} | Level: ${trip.difficulty}

OVERVIEW:
${trip.description}

HIGHLIGHTS:
${trip.highlights.map((h) => `• ${h}`).join("\n")}

INCLUSIONS:
${trip.inclusions.map((i) => `✓ ${i}`).join("\n")}

EXCLUSIONS:
${trip.exclusions.map((e) => `✗ ${e}`).join("\n")}

DAY-BY-DAY ITINERARY:
${trip.itinerary
  .map(
    (item) =>
      `Day ${item.day}: ${item.title}\n${item.description}\nStay: ${item.stay || "Standard"} | Meals: ${item.meals || "Included"}\n`
  )
  .join("\n")}

IMPORTANT NOTES:
${(trip.importantInfo || ["Carry valid ID proof", "Acclimatize properly"]).join("\n")}

For inquiries & customized booking:
WhatsApp: +91 98200 45120
Email: hello@alpine-expeditions.com
======================================================
`;

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${trip.slug}-itinerary-brochure.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#FAF9F6] rounded-3xl border border-[#E5E0D8] max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#6B7280] hover:text-[#1C1E21] hover:bg-black/5"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#1C1E21] text-white flex items-center justify-center mb-5 shadow-xs">
          <FileText className="w-6 h-6 text-emerald-400" />
        </div>

        <span className="text-[11px] uppercase tracking-widest text-[#4B6B5B] font-semibold block mb-1">
          Official Itinerary Document
        </span>
        <h3 className="text-xl font-medium text-[#1C1E21] leading-snug mb-2">
          {trip.title} Brochure
        </h3>
        <p className="text-xs sm:text-sm text-[#4A5568] mb-6 leading-relaxed">
          Comprehensive PDF guide containing high-altitude trail elevation maps, day-by-day packing lists, safety protocols, and certified team details.
        </p>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E0D8] flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
              PDF
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1C1E21] line-clamp-1">
                {trip.slug}-brochure.pdf
              </div>
              <div className="text-[11px] text-[#6B7280]">
                {trip.duration} Days • 3.4 MB
              </div>
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3.5 px-6 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-75"
          >
            {downloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Preparing Document...</span>
              </>
            ) : downloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Downloaded Successfully</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Brochure</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs text-[#6B7280] hover:text-[#1C1E21] font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
