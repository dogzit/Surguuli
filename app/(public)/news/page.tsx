import type { Metadata } from "next";
import { News } from "@/components/home/News";
import { loadNewsItems } from "@/lib/site-data";
import { loadSchoolName } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Мэдээ, зарлал · ${name}` : "Мэдээ, зарлал",
    description: "Албан ёсны шийдвэр, тайлан, эцэг эхэд зориулсан зарлалууд.",
  };
}

export const revalidate = 60;

export default async function NewsPage() {
  const items = await loadNewsItems();
  return <News items={items} />;
}
