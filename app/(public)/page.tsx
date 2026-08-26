import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { News } from "@/components/home/News";
import { Gallery } from "@/components/home/Gallery";
import { Achievements } from "@/components/home/Achievements";
import { EventsSection } from "@/components/home/EventsSection";
import { ClubsSection } from "@/components/home/ClubsSection";
import { loadSchoolInfo, loadNewsItems, loadGallery, loadAchievements, loadEvents, loadClubs } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Нийслэлийн ерөнхий боловсролын 3-р сургууль · Албан ёсны хуудас",
  description:
    "Нийслэлийн ерөнхий боловсролын 3-р сургуулийн танилцуулга, түүх, виртуал аялал, анги бүлэг, сургалтын чанар, хүүхэд хамгааллын албан ёсны цахим хуудас.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [info, newsItems, gallery, achievements, events, clubs] = await Promise.all([
    loadSchoolInfo(),
    loadNewsItems(),
    loadGallery(),
    loadAchievements(),
    loadEvents(),
    loadClubs(),
  ]);

  return (
    <>
      <Hero
        students={info.hero_stats_students ?? "1,120+"}
        staff={info.hero_stats_staff ?? "84"}
        foundedYear={info.founded_year ?? "1921"}
        principalName={info.principal_name}
        principalQuote={info.principal_quote}
      />
      <News items={newsItems} />
      <Gallery images={gallery} />
      <Achievements items={achievements} />
      <ClubsSection clubs={clubs} />
      <EventsSection events={events} />
    </>
  );
}
