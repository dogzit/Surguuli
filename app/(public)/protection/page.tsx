import type { Metadata } from "next";
import { Protection } from "@/components/home/Protection";
import { loadSchoolInfo } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Хүүхэд хамгаалал · Нийслэлийн ерөнхий боловсролын 3-р сургууль",
  description:
    "Хүүхдийн эрх, аюулгүй байдлыг хамгаалах бодлого, эрсдэлийн үнэлгээ, албан ёсны хариуцлагатай ажилтан.",
};

export const revalidate = 300;

export default async function ProtectionPage() {
  const info = await loadSchoolInfo();
  const policies = [
    info.protection_policy_1,
    info.protection_policy_2,
    info.protection_policy_3,
    info.protection_policy_4,
  ].filter(Boolean) as string[];

  return (
    <Protection
      policies={policies}
      officer={info.protection_officer ?? "Д. Соёлмаа"}
      phone={info.protection_phone ?? "7011-1189"}
      email={info.protection_email ?? "uuriingegee22@gmail.com"}
    />
  );
}
