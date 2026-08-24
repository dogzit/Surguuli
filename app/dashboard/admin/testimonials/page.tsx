import { MessageSquare } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { SimpleListPanel } from "../ContentPanel";

export default async function TestimonialsPage() {
  if (!(await isAdmin())) return <AdminGate />;

  const testimonials = await prisma.testimonial.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Сэтгэгдэл</h1>
          <p className="text-xs text-muted-foreground">Эцэг эхийн үнэлгээ</p>
        </div>
      </div>
      <SimpleListPanel items={testimonials.map((t) => ({ id: t.id, name: t.name, role: t.role, text: t.text, rating: t.rating, order: t.order }))} type="testimonial" />
    </>
  );
}
