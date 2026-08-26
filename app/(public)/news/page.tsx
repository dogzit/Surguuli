import type { Metadata } from "next";
import { News } from "@/components/home/News";
import { loadNewsItems } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Мэдээ, зарлал · Нийслэлийн ерөнхий боловсролын 3-р сургууль",
  description:
    "Албан ёсны шийдвэр, тайлан, эцэг эхэд зориулсан зарлалууд.",
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const items = await loadNewsItems();
  return <News items={items} />;
}
