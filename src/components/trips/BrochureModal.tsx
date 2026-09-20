"use client";

import React, { useState, useMemo } from "react";
import { FileText, Download, Check, X, AlertCircle } from "lucide-react";
import { Trip } from "@/lib/types";

interface BrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

function getExtLabel(url: string): string {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
  const labels: Record<string, string> = {
    pdf: "PDF", doc: "DOC", docx: "DOCX", ppt: "PPT", pptx: "PPTX",
    xls: "XLS", xlsx: "XLSX", txt: "TXT", csv: "CSV",
  };
  return labels[ext] || "FILE";
}

function getFilenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "";
    if (last && last.includes(".")) return decodeURIComponent(last);
  } catch {}
  const parts = url.split("?")[0].split("/");
  const last = parts[parts.length - 1] || "";
  if (last && last.includes(".")) return decodeURIComponent(last);
  return "brochure";
}

function getExtColorClass(url: string): string {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
  if (ext === "pdf") return "bg-red-50 text-red-600";
  if (["doc", "docx"].includes(ext)) return "bg-blue-50 text-blue-600";
  if (["ppt", "pptx"].includes(ext)) return "bg-orange-50 text-orange-600";
  if (["xls", "xlsx"].includes(ext)) return "bg-green-50 text-green-600";
  return "bg-stone-100 text-stone-600";
}

export const BrochureModal: React.FC<BrochureModalProps> = ({
  isOpen,
  onClose,
  trip,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brochureUrl = trip.brochureUrl;

  const filename = useMemo(
    () => (brochureUrl ? getFilenameFromUrl(brochureUrl) : ""),
    [brochureUrl]
  );
  const extLabel = useMemo(
    () => (brochureUrl ? getExtLabel(brochureUrl) : ""),
    [brochureUrl]
  );
  const extColor = useMemo(
    () => (brochureUrl ? getExtColorClass(brochureUrl) : "bg-stone-100 text-stone-600"),
    [brochureUrl]
  );

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!brochureUrl) {
      setError("No brochure file available for this trip.");
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const apiDownloadUrl = `/api/brochure?url=${encodeURIComponent(brochureUrl)}`;
      const response = await fetch(apiDownloadUrl);

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Download failed (${response.status})`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const cdFilename = disposition.match(/filename="(.+?)"/)?.[1];
      const downloadName = cdFilename || filename || "brochure";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloaded(true);
    } catch (err: any) {
      setError(err.message || "Unable to download brochure. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF9F6] rounded-3xl border border-[#E5E0D8] max-w-md w-full p-6 sm:p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6B7280] hover:text-[#1C1E21] hover:bg-black/5 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl ${extColor} flex items-center justify-center shrink-0`}>
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-[#1C1E21] leading-snug">
              {trip.title} Brochure
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {trip.destination} &middot; {trip.duration} days
            </p>
          </div>
        </div>

        {brochureUrl ? (
          <div className="p-4 rounded-2xl bg-white border border-[#E5E0D8] flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-xl ${extColor} flex items-center justify-center font-bold text-xs shrink-0`}>
              {extLabel}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[#1C1E21] truncate">
                {filename || "Brochure Document"}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">
                {extLabel} Document
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-50 border border-[#E5E0D8] mb-6">
            <div className="text-xs text-[#6B7280] text-center">
              No brochure file has been uploaded for this trip.
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || !brochureUrl}
            className="w-full py-3.5 px-6 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Downloading...</span>
              </>
            ) : downloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Downloaded</span>
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
            className="w-full py-2.5 text-xs text-[#6B7280] hover:text-[#1C1E21] font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
