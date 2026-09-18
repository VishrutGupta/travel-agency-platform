import { SupabaseStorageService } from "./supabaseStorageService";

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
}

export interface IStorageService {
  uploadImage(file: File): Promise<UploadResult>;
  uploadPdf(file: File): Promise<UploadResult>;
}

class MockStorageService implements IStorageService {
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

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          filename: file.name,
          size: file.size,
        });
      };
      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.readAsDataURL(file);
    });
  }

  async uploadPdf(file: File): Promise<UploadResult> {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("Invalid document format. Please upload a PDF file.");
    }
    // Max 25MB
    if (file.size > 25 * 1024 * 1024) {
      throw new Error("PDF file size exceeds 25MB limit.");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          filename: file.name,
          size: file.size,
        });
      };
      reader.onerror = () => reject(new Error("Failed to read PDF file."));
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Exported singleton. Uses SupabaseStorageService when Supabase env vars are
 * configured; falls back to MockStorageService (FileReader/Data URL) for
 * local development without a Supabase backend.
 */
const hasSupabase =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const storageService: IStorageService = hasSupabase
  ? new SupabaseStorageService()
  : new MockStorageService();
