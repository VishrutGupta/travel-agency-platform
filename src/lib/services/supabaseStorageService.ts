import { type IStorageService, type UploadResult } from "./storageService";
import { createSupabaseClient } from "@/lib/supabase/client";

/**
 * Supabase-backed implementation of IStorageService.
 * Uploads images and PDFs to Supabase Storage buckets.
 */
export class SupabaseStorageService implements IStorageService {
  private supabase: ReturnType<typeof createSupabaseClient>;

  constructor() {
    this.supabase = createSupabaseClient();
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

    const { error: uploadError } = await this.supabase.storage
      .from("trip-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

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

    const { error: uploadError } = await this.supabase.storage
      .from("trip-brochures")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

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
}