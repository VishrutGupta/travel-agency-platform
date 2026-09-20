"use client";

import React, { useState } from "react";
import { FileText, Download, Check, X, AlertCircle } from "lucide-react";
import { Trip } from "@/lib/types";

interface BrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

function getMimeType(url: string): string {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
  const mimeMap: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    csv: "text/csv",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  };
  return mimeMap[ext] || "application/octet-stream";
}

function getFilenameFromUrl(url: string): string {
  const path = url.split("?")[0];
  const parts = path.split("/");
  return parts[parts.length - 1] || "brochure";
}

export const BrochureModal: React.FC<BrochureModalProps> = ({
  isOpen,
  onClose,
  trip,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!trip.brochureUrl) {
      setError("No brochure file available for this trip.");
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const response = await fetch(trip.brochureUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch brochure: ${response.statusText}`);
      }

      const blob = await response.blob();
      const mimeType = getMimeType(trip.brochureUrl);
      const filename = getFilenameFromUrl(trip.brochureUrl);

      const typedBlob = new Blob([blob], { type: mimeType });
      const url = URL.createObjectURL(typedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloaded(true);
    } catch (err: any) {
      setError(err.message || "Failed to download brochure. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const displayFilename = trip.brochureUrl
    ? getFilenameFromUrl(trip.brochureUrl)
    : "brochure";

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
          Comprehensive brochure containing trip details, itinerary, inclusions, and important information.
        </p>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E0D8] flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
              {displayFilename.split(".").pop()?.toUpperCase() || "FILE"}
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1C1E21] line-clamp-1">
                {displayFilename}
              </div>
              <div className="text-[11px] text-[#6B7280]">
                {trip.duration} Days
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 mb-4">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || !trip.brochureUrl}
            className="w-full py-3.5 px-6 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-75"
          >
            {downloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Downloading...</span>
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
