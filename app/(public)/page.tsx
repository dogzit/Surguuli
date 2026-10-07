import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { News } from "@/components/home/News";
import { Gallery } from "@/components/home/Gallery";
import { Achievements } from "@/components/home/Achievements";
import { EventsSection } from "@/components/home/EventsSection";
import { ClubsSection } from "@/components/home/ClubsSection";
import { loadNewsItems, loadGallery, loadAchievements, loadEvents, loadClubs } from "@/lib/site-data";
import { loadSchoolInfoBundle } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const info = await loadSchoolInfoBundle();
  const title = info.name
    ? `${info.name} · Албан ёсны хуудас`
    : "Албан ёсны хуудас";
  return {
    title,
    description: info.name
      ? `${info.name}-ийн танилцуулга, түүх, виртуал аялал, анги бүлэг, сургалтын чанар, хүүхэд хамгааллын албан ёсны цахим хуудас.`
      : "Албан ёсны цахим хуудас.",
  };
}

// ISR: rebuild at most once per minute — admin mutations call
// revalidatePath("/") so edits show up immediately anyway. Removes the
// per-request Prisma fan-out that used to hit Neon for every visitor.
export const revalidate = 60;

export default async function HomePage() {
  const [info, newsItems, gallery, achievements, events, clubs] = await Promise.all([
    loadSchoolInfoBundle(),
    loadNewsItems(),
    loadGallery(),
    loadAchievements(),
    loadEvents(),
    loadClubs(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Structured data helps search engines identify the site as an official
  // educational organization. All fields come from SchoolInfo — never
  // synthesized so wrong values don't produce misleading rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: info.name ?? undefined,
    alternateName: info.shortName ?? undefined,
    url: siteUrl,
    foundingDate: info.foundedYear ?? undefined,
    address: info.address
      ? {
          "@type": "PostalAddress",
          streetAddress: info.address,
          addressLocality: info.city ?? undefined,
          addressCountry: "MN",
        }
      : undefined,
    telephone: info.phone ?? undefined,
    email: info.email ?? undefined,
    sameAs: [] as string[],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero
        schoolName={info.name}
        district={info.district}
        city={info.city}
        foundedYear={info.foundedYear}
        students={info.heroStudents}
        staff={info.heroStaff}
        principalName={info.principalName}
        principalQuote={info.principalQuote}
      />
      <News items={newsItems} />
      <Gallery images={gallery} />
      <Achievements items={achievements} />
      <ClubsSection clubs={clubs} />
      <EventsSection events={events} />
    </>
  );
}
