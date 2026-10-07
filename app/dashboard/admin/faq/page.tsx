import { HelpCircle } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { SimpleListPanel } from "../ContentPanel";
import { PageHero } from "../PageHero";

export default async function FaqPage() {
  const access = await canAccessAdmin();
  if (access.role !== "ADMIN") return <AdminGate role={access.role as "APPROVER" | null} />;

  const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } });

  // Rough length hint: shows the admin at a glance whether answers are
  // short one-liners or full paragraphs, without needing to open each row.
  const avgAnswerLen = faqs.length
    ? Math.round(faqs.reduce((sum, f) => sum + f.answer.length, 0) / faqs.length)
    : 0;

  return (
    <>
      <PageHero
        icon={HelpCircle}
        title="Асуулт"
        subtitle="Эцэг эх, сурагчдын түгээмэл асуулт, хариулт"
        accent="indigo"
        stats={[
          { label: "Асуулт", value: faqs.length, tone: "accent" },
          ...(faqs.length ? [{ label: "Дундаж уртат", value: `${avgAnswerLen} тэмдэгт` } as const] : []),
        ]}
      />
      <SimpleListPanel items={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer, order: f.order }))} type="faq" />
    </>
  );
}
