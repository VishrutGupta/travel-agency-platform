import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MIME_MAP: Record<string, string> = {
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

function extractStoragePath(brochureUrl: string): { bucket: string; path: string } | null {
  try {
    const url = new URL(brochureUrl);
    const segments = url.pathname.split("/").filter(Boolean);

    const objectIdx = segments.indexOf("object");
    if (objectIdx === -1) return null;

    const mode = segments[objectIdx + 1];
    let bucketIdx: number;

    if (mode === "public" || mode === "sign") {
      bucketIdx = objectIdx + 2;
    } else {
      bucketIdx = objectIdx + 1;
    }

    const bucket = segments[bucketIdx];
    const path = segments.slice(bucketIdx + 1).join("/");
    if (!bucket || !path) return null;

    return { bucket, path };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const brochureUrl = request.nextUrl.searchParams.get("url");

  if (!brochureUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(brochureUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const storagePath = extractStoragePath(brochureUrl);

  if (storagePath) {
    const { data, error } = await supabase.storage
      .from(storagePath.bucket)
      .download(storagePath.path);

    if (error || !data) {
      return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
    }

    const ext = storagePath.path.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME_MAP[ext] || "application/octet-stream";
    const filename = storagePath.path.split("/").pop() || `brochure.${ext}`;

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(data, { status: 200, headers });
  }

  const fetchResponse = await fetch(brochureUrl);
  if (!fetchResponse.ok) {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
  }

  const blob = await fetchResponse.blob();
  const ext = parsed.pathname.split(".").pop()?.toLowerCase() || "";
  const contentType = fetchResponse.headers.get("Content-Type") || MIME_MAP[ext] || "application/octet-stream";
  const filename = parsed.pathname.split("/").pop() || `brochure.${ext}`;

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Cache-Control", "public, max-age=3600");

  return new NextResponse(blob, { status: 200, headers });
}
