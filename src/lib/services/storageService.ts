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
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid image format. Please upload JPG, PNG, or WebP.");
    }
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
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExts = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv"];
    if (!allowedExts.includes(ext)) {
      throw new Error("Invalid document format. Please upload PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, or CSV.");
    }
    if (file.size > 25 * 1024 * 1024) {
      throw new Error("Document file size exceeds 25MB limit.");
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
      reader.onerror = () => reject(new Error("Failed to read document file."));
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
