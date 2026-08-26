import type { Metadata } from "next";
import { Contact } from "@/components/home/Contact";
import { loadSchoolInfo } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Холбоо барих · Нийслэлийн ерөнхий боловсролын 3-р сургууль",
  description:
    "Албан бичиг, сурагчийн бүртгэл, эцэг эхийн хүсэлт болон бусад асуудлаар холбогдох.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const info = await loadSchoolInfo();

  return (
    <Contact
      address={info.address ?? "Сүхбаатар дүүрэг, 10-р хороо"}
      phone={info.phone ?? "(976) 7011-1180"}
      email={info.email ?? "uuriingegee22@gmail.com"}
      workHours={info.work_hours ?? "Дав—Баа · 08:00 — 17:00"}
    />
  );
}
