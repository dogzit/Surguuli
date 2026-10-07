import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import {
  persistUpload,
  type UploadCategory,
} from "@/lib/uploads";

// Node runtime so we can hit the filesystem for the local driver.
export const runtime = "nodejs";
// Uploads mutate the "public/" tree — never cache.
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = new Set<UploadCategory>(["image", "document", "video", "any"]);

export async function POST(req: Request) {
  // Admin-only in MVP. Once parents upload avatars (Month 2) we'll add
  // an actor check + smaller quotas for non-admin uploads.
  const gate = await ensureAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Хүсэлт multipart/form-data биш байна." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл олдсонгүй." }, { status: 400 });
  }

  const rawCategory = String(formData.get("category") ?? "image");
  const category = VALID_CATEGORIES.has(rawCategory as UploadCategory)
    ? (rawCategory as UploadCategory)
    : "image";

  try {
    const uploaded = await persistUpload(file, { category });
    await logAudit({
      action: "upload.create",
      targetType: "upload",
      targetId: uploaded.key,
      metadata: {
        category,
        size: uploaded.size,
        contentType: uploaded.contentType,
        name: file.name,
      },
    });
    return NextResponse.json({
      url: uploaded.url,
      size: uploaded.size,
      contentType: uploaded.contentType,
      key: uploaded.key,
    });
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode ?? 500;
    const message = err instanceof Error ? err.message : "Файл хадгалахад алдаа гарлаа.";
    return NextResponse.json({ error: message }, { status });
  }
}
