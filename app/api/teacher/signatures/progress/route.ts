import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { APPROVER_POSITIONS } from "@/lib/positions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ signed: 0, total: 0, complete: false });
  }

  const signatures = await prisma.signature.findMany({
    where: { teacherId: user.id },
    include: {
      approver: { select: { position: true } },
    },
  });

  const validPositions = new Set<string>(APPROVER_POSITIONS);
  const signedPositions = new Set(
    signatures
      .filter((s) => validPositions.has(s.approver.position))
      .map((s) => s.approver.position),
  );

  const total = APPROVER_POSITIONS.length;
  const signed = signedPositions.size;

  return NextResponse.json({
    signed,
    total,
    complete: signed >= total,
  });
}
