"use client";

import React, { useRef, useState } from "react";
import { Upload, FileText, Image as ImageIcon, Check, X, AlertCircle } from "lucide-react";
import { storageService } from "@/lib/services/storageService";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = "Cover Image",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const result = await storageService.uploadImage(file);
      onChange(result.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-[#1C1E21]">{label}</label>

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-[#E5E0D8] bg-stone-100 group max-w-sm aspect-16/9">
          <img
            src={value}
            alt="Uploaded Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/90 text-[#1C1E21] text-xs font-semibold hover:bg-white transition-colors"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="max-w-sm h-36 rounded-2xl border-2 border-dashed border-[#CBD5E1] hover:border-[#4B6B5B] bg-[#FAF9F6] hover:bg-[#F5F4F0] flex flex-col items-center justify-center cursor-pointer transition-all p-4 text-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-[#1C1E21] border-t-transparent rounded-full animate-spin mb-2" />
          ) : (
            <ImageIcon className="w-6 h-6 text-[#6B7280] mb-2" />
          )}
          <span className="text-xs font-semibold text-[#1C1E21]">
            {loading ? "Processing image..." : "Upload Cover Image"}
          </span>
          <span className="text-[10px] text-[#6B7280] mt-0.5">
            JPG, PNG or WebP up to 10MB
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
    </div>
  );
};

interface PdfUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  value,
  onChange,
  label = "Brochure PDF",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const result = await storageService.uploadPdf(file);
      onChange(result.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload PDF.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-[#1C1E21]">{label}</label>

      {value ? (
        <div className="max-w-sm p-4 rounded-2xl bg-white border border-[#E5E0D8] flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
              PDF
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#1C1E21] truncate block">
                Brochure document attached
              </span>
              <span className="text-[10px] text-[#4B6B5B] flex items-center gap-1 font-medium">
                <Check className="w-3 h-3" /> Ready for download
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-xs font-medium text-[#1C1E21] hover:underline"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1 text-[#6B7280] hover:text-red-600"
              title="Remove brochure"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="max-w-sm h-28 rounded-2xl border-2 border-dashed border-[#CBD5E1] hover:border-[#4B6B5B] bg-[#FAF9F6] hover:bg-[#F5F4F0] flex flex-col items-center justify-center cursor-pointer transition-all p-4 text-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-[#1C1E21] border-t-transparent rounded-full animate-spin mb-1.5" />
          ) : (
            <FileText className="w-5 h-5 text-[#6B7280] mb-1.5" />
          )}
          <span className="text-xs font-semibold text-[#1C1E21]">
            {loading ? "Uploading document..." : "Upload Brochure PDF"}
          </span>
          <span className="text-[10px] text-[#6B7280]">
            PDF documents up to 25MB
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />
    </div>
  );
};
