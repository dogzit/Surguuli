import { Card } from "@/components/ui/card";
import { SectionShell } from "./SectionShell";
import type { NewsItemRow } from "@/lib/site-data";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function News({ items }: { items: NewsItemRow[] }) {
  return (
    <SectionShell
      id="news"
      tone="light"
      eyebrow="Мэдээ, зарлал"
      title="Захиргааны шинэ мэдээ"
      description="Албан ёсны шийдвэр, тайлан, эцэг эхэд зориулсан зарлалуудыг цаг тухайд нь энд байршуулна."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((it) => (
          <Card
            key={it.id}
            className="flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
              <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-semibold text-muted-foreground">
                {it.tag}
              </span>
              <time className="text-muted-foreground tabular-nums">
                {fmtDate(it.date)}
              </time>
            </div>
            <h3 className="mt-3 text-base font-semibold leading-snug text-foreground">
              {it.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {it.excerpt}
            </p>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
            Одоогоор мэдээ байхгүй
          </div>
        )}
      </div>
    </SectionShell>
  );
}
