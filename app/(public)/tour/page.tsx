import type { Metadata } from "next";
import { VirtualTour } from "@/components/home/VirtualTour";
import { loadTourRooms } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Виртуал аялал · Монгол 3-р сургууль",
  description:
    "Сургуулийг өөрөө нэг зочилж үзээрэй — зогсоол бүр дээрх орчин үеийн боловсролын байгууламжтай танилцаарай.",
};

export default async function TourPage() {
  const rooms = await loadTourRooms();
  return <VirtualTour rooms={rooms} />;
}
