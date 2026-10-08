import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Called by the staff site (lib/public-site.ts there) after staff change
// content, so cached pages show the change now instead of after their
// revalidate timer. Authenticated by a secret both sites share.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(header: string | null): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !header) return false; // fail closed when unconfigured
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  // Content edits are rare; refreshing every page is simpler than tracking
  // which page reads which table.
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
