import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { News } from "@/components/home/News";
import { Gallery } from "@/components/home/Gallery";
import { Achievements } from "@/components/home/Achievements";
import { FaqSection } from "@/components/home/FaqSection";
import { EventsSection } from "@/components/home/EventsSection";
import { Testimonials } from "@/components/home/Testimonials";
import { ClubsSection } from "@/components/home/ClubsSection";
import { loadSchoolInfo, loadNewsItems, loadGallery, loadAchievements, loadFaqs, loadEvents, loadTestimonials, loadClubs } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Монгол 3-р сургууль · Албан ёсны хуудас",
  description:
    "Монгол 3-р сургуулийн танилцуулга, түүх, виртуал аялал, анги бүлэг, сургалтын чанар, хүүхэд хамгааллын албан ёсны цахим хуудас.",
};

export default async function HomePage() {
  const [info, newsItems, gallery, achievements, faqs, events, testimonials, clubs] = await Promise.all([
    loadSchoolInfo(),
    loadNewsItems(),
    loadGallery(),
    loadAchievements(),
    loadFaqs(),
    loadEvents(),
    loadTestimonials(),
    loadClubs(),
  ]);

  return (
    <>
      <Hero
        students={info.hero_stats_students ?? "1,120+"}
        staff={info.hero_stats_staff ?? "84"}
      />
      <News items={newsItems} />
      <Gallery images={gallery} />
      <Achievements items={achievements} />
      <ClubsSection clubs={clubs} />
      <EventsSection events={events} />
      <Testimonials items={testimonials} />
      <FaqSection items={faqs} />
    </>
  );
}
