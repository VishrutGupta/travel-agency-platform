import { IStorageService, UploadResult } from "../types";
import { storageService } from "./storageService";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { NextjsRequest } from "@supabase/ssr";

export class SupabaseStorageService implements IStorageService {
  private supabase: ReturnType<typeof createSupabaseClient>["default"];

  constructor(request: NextjsRequest) {
    this.supabase = createSupabaseClient(request);
  }

  async uploadImage(file: File): Promise<UploadResult> {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid image format. Please upload JPG, PNG, or WebP.");
    }
    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Image file size exceeds 10MB limit.");
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}.${fileExt}`;
    const filePath = `trip-images/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from("trip-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from("trip-images")
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      filename: file.name,
      size: file.size,
    };
  }

  async uploadPdf(file: File): Promise<UploadResult> {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("Invalid document format. Please upload a PDF file.");
    }
    // Max 25MB
    if (file.size > 25 * 1024 * 1024) {
      throw new Error("PDF file size exceeds 25MB limit.");
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}.${fileExt}`;
    const filePath = `trip-brochures/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from("trip-brochures")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from("trip-brochures")
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      filename: file.name,
      size: file.size,
    };
  }

  // Delegate to the existing mock storage service for backward compatibility
  // In a full implementation, this would use Supabase Storage
  async uploadImageLegacy(file: File): Promise<UploadResult> {
    return storageService.uploadImage(file);
  }

  async uploadPdfLegacy(file: File): Promise<UploadResult> {
    return storageService.uploadPdf(file);
  }
}