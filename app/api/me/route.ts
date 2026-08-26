import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ name: null, position: null }, { status: 401 });
  }
  return NextResponse.json({ name: user.name, position: user.position });
}
