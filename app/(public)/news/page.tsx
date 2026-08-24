import type { Metadata } from "next";
import { News } from "@/components/home/News";
import { loadNewsItems } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Мэдээ, зарлал · Монгол 3-р сургууль",
  description:
    "Албан ёсны шийдвэр, тайлан, эцэг эхэд зориулсан зарлалууд.",
};

export default async function NewsPage() {
  const items = await loadNewsItems();
  return <News items={items} />;
}
