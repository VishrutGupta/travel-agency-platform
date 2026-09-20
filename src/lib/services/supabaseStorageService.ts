import { type IStorageService, type UploadResult } from "./storageService";
import { createSupabaseClient } from "@/lib/supabase/client";

const ALLOWED_BROCHURE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);

const ALLOWED_BROCHURE_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv",
]);

const MAX_BROCHURE_SIZE = 25 * 1024 * 1024;

export class SupabaseStorageService implements IStorageService {
  private supabase: ReturnType<typeof createSupabaseClient>;

  constructor() {
    this.supabase = createSupabaseClient();
  }

  async uploadImage(file: File): Promise<UploadResult> {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid image format. Please upload JPG, PNG, or WebP.");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Image file size exceeds 10MB limit.");
    }

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
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_BROCHURE_TYPES.has(file.type) && !ALLOWED_BROCHURE_EXTENSIONS.has(ext)) {
      throw new Error("Invalid document format. Please upload PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, or CSV.");
    }
    if (file.size > MAX_BROCHURE_SIZE) {
      throw new Error("Document file size exceeds 25MB limit.");
    }

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
