import { HelpCircle } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { SimpleListPanel } from "../ContentPanel";

export default async function FaqPage() {
  if (!(await isAdmin())) return <AdminGate />;

  const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } });

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Асуулт</h1>
          <p className="text-xs text-muted-foreground">Түгээмэл асуултууд</p>
        </div>
      </div>
      <SimpleListPanel items={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer, order: f.order }))} type="faq" />
    </>
  );
}
