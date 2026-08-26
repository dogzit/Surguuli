import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, name: true, position: true, pin: true },
  });

  return NextResponse.json(teachers);
}
