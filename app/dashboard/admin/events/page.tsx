import { Calendar } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { SimpleListPanel } from "../ContentPanel";

export default async function EventsPage() {
  if (!(await isAdmin())) return <AdminGate />;

  const events = await prisma.event.findMany({ orderBy: { date: "asc" } });

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Үйл явдал</h1>
          <p className="text-xs text-muted-foreground">
            Сургуулийн арга хэмжээнүүд
          </p>
        </div>
      </div>
      <SimpleListPanel items={events.map((e) => ({ id: e.id, title: e.title, date: e.date.toISOString(), time: e.time, location: e.location, description: e.description, type: e.type, order: e.order }))} type="event" />
    </>
  );
}
