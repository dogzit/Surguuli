import type { Metadata } from "next";
import { Contact } from "@/components/home/Contact";
import { loadSchoolInfoBundle, loadSchoolName } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Холбоо барих · ${name}` : "Холбоо барих",
    description:
      "Албан бичиг, сурагчийн бүртгэл, эцэг эхийн хүсэлт болон бусад асуудлаар холбогдох.",
  };
}

export const revalidate = 3600;

export default async function ContactPage() {
  const info = await loadSchoolInfoBundle();
  return (
    <Contact
      schoolName={info.name ?? ""}
      address={info.address ?? ""}
      phone={info.phone ?? ""}
      email={info.email ?? ""}
      workHours={info.workHours ?? ""}
      mapUrl={info.mapUrl ?? ""}
    />
  );
}
