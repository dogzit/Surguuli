import type { Metadata } from "next";
import { VirtualTour } from "@/components/home/VirtualTour";
import { loadTourRooms } from "@/lib/site-data";
import { loadSchoolName } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Виртуал аялал · ${name}` : "Виртуал аялал",
    description:
      "Зогсоол бүр дээрх орчин үеийн боловсролын байгууламжтай танилцаарай.",
  };
}

export const revalidate = 3600;

export default async function TourPage() {
  const rooms = await loadTourRooms();
  return <VirtualTour rooms={rooms} />;
}
