import type { Metadata } from "next";
import { Protection } from "@/components/home/Protection";
import { loadSchoolInfoBundle, loadSchoolName } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Хүүхэд хамгаалал · ${name}` : "Хүүхэд хамгаалал",
    description:
      "Хүүхдийн эрх, аюулгүй байдлыг хамгаалах бодлого, эрсдэлийн үнэлгээ, албан ёсны хариуцлагатай ажилтан.",
  };
}

export const revalidate = 3600;

export default async function ProtectionPage() {
  const info = await loadSchoolInfoBundle();
  return (
    <Protection
      policies={info.protectionPolicies}
      officer={info.protectionOfficer ?? ""}
      phone={info.protectionPhone ?? ""}
      email={info.protectionEmail ?? ""}
    />
  );
}
