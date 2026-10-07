import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

// Pluggable upload driver. The `local` driver writes to
// `public/uploads/**` — good enough for a self-hosted MVP and cheap
// during development. Set `UPLOAD_DRIVER=r2` (plus R2 env vars) to
// route to Cloudflare R2 without a code change once the account is
// provisioned.
export type UploadDriver = "local" | "r2";

export interface UploadedFile {
  /** Public URL the browser can fetch. */
  url: string;
  /** Byte size after write. */
  size: number;
  /** MIME type sniffed from the upload. */
  contentType: string;
  /** The stable key we stored — used later for delete/list. */
  key: string;
}

// Hard-cap uploads at 10 MB. Individual routes can shrink further —
// e.g. cover images at 3 MB — via `maxBytes`.
export const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

// Whitelisted MIME types keyed by broad category. Anything not here
// is rejected with a 415 before it hits disk.
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const DOC_TYPES = new Set([
  "application/pdf",
]);
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
]);

export type UploadCategory = "image" | "document" | "video" | "any";

export function isAllowedType(
  contentType: string,
  category: UploadCategory,
): boolean {
  switch (category) {
    case "image":
      return IMAGE_TYPES.has(contentType);
    case "document":
      return DOC_TYPES.has(contentType);
    case "video":
      return VIDEO_TYPES.has(contentType);
    case "any":
      return (
        IMAGE_TYPES.has(contentType) ||
        DOC_TYPES.has(contentType) ||
        VIDEO_TYPES.has(contentType)
      );
  }
}

/**
 * Derive a safe filename: keep the original stem for legibility,
 * strip anything not `[A-Za-z0-9._-]`, and prepend a random suffix so
 * two uploads of the same-named file don't collide.
 */
function safeStableName(original: string): string {
  const parsed = path.parse(original);
  const cleanStem = parsed.name
    .normalize("NFKD")
    .replace(/[^\w.-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "file";
  const cleanExt = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 8);
  const rand = crypto.randomBytes(6).toString("hex");
  return `${cleanStem}-${rand}${cleanExt}`;
}

function currentDrive(): UploadDriver {
  const v = process.env.UPLOAD_DRIVER;
  return v === "r2" ? "r2" : "local";
}

/** Public accessor so the API route can echo it back for debugging. */
export function activeUploadDriver(): UploadDriver {
  return currentDrive();
}

// ── Local disk driver ─────────────────────────────────────────
// Writes to `public/uploads/YYYY/MM/name.ext`. Next.js serves
// `/public/*` at the site root, so the URL is
// `/uploads/YYYY/MM/name.ext` — no rewrites needed.

const LOCAL_ROOT = path.join(process.cwd(), "public", "uploads");

async function writeLocal(
  bytes: Buffer,
  originalName: string,
  contentType: string,
): Promise<UploadedFile> {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const filename = safeStableName(originalName);
  const relDir = path.join(yyyy, mm);
  const absDir = path.join(LOCAL_ROOT, relDir);
  await fs.mkdir(absDir, { recursive: true });
  const absPath = path.join(absDir, filename);
  await fs.writeFile(absPath, bytes);
  return {
    key: path.join(relDir, filename),
    url: `/uploads/${path.join(relDir, filename).split(path.sep).join("/")}`,
    size: bytes.byteLength,
    contentType,
  };
}

// ── R2 driver (stub) ──────────────────────────────────────────
// Not wired to the real SDK yet — we throw a clear error rather than
// silently uploading somewhere unintended. Ready to swap when R2
// credentials land in .env.

async function writeR2(
  _bytes: Buffer,
  _originalName: string,
  _contentType: string,
): Promise<UploadedFile> {
  throw new Error(
    "R2 driver not configured yet — install @aws-sdk/client-s3, add R2 env vars, and implement writeR2.",
  );
}

/**
 * Persist a File payload (as received from a form-data upload) and
 * return its public URL. Enforces size/type limits before writing.
 */
export async function persistUpload(
  file: File,
  options?: { category?: UploadCategory; maxBytes?: number },
): Promise<UploadedFile> {
  const category = options?.category ?? "image";
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;

  if (file.size > maxBytes) {
    throw Object.assign(
      new Error(
        `Файл ${(file.size / 1024 / 1024).toFixed(1)}MB — дээд хэмжээ ${(maxBytes / 1024 / 1024).toFixed(0)}MB.`,
      ),
      { statusCode: 413 },
    );
  }

  const contentType = file.type || "application/octet-stream";
  if (!isAllowedType(contentType, category)) {
    throw Object.assign(
      new Error(`Файлын төрөл дэмжигдээгүй: ${contentType}`),
      { statusCode: 415 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const driver = currentDrive();
  switch (driver) {
    case "local":
      return writeLocal(buffer, file.name || "upload.bin", contentType);
    case "r2":
      return writeR2(buffer, file.name || "upload.bin", contentType);
  }
}
