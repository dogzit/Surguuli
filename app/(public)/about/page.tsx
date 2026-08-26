import type { Metadata } from "next";
import { About } from "@/components/home/About";
import { loadSchoolInfo } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Танилцуулга · Нийслэлийн ерөнхий боловсролын 3-р сургууль",
  description:
    "Нийслэлийн ерөнхий боловсролын 3 дугаар сургуулийн танилцуулга, түүх, зорилго, уламжлал.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const info = await loadSchoolInfo();
  return (
    <About
      students={info.hero_stats_students ?? "1,120+"}
      staff={info.hero_stats_staff ?? "84"}
      olympiadMedals={info.quality_olympiad_medals ?? "27"}
      foundedYear={Number(info.founded_year) || 1921}
    />
  );
}
