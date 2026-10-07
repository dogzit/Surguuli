import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
        {items.map((it) => {
          const body = (
            <Card className="flex h-full flex-col overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
                {it.coverImage && (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.coverImage}
                      alt={it.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                    <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-semibold text-muted-foreground">
                      {it.tag}
                    </span>
                    <time className="text-muted-foreground tabular-nums">
                      {fmtDate(it.publishedAt ?? it.date)}
                    </time>
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-snug text-foreground transition group-hover:text-primary">
                    {it.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {it.excerpt}
                  </p>
                  {it.slug && (
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                      Дэлгэрэнгүй унших
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </Card>
          );
          // Wrap in a Link only if we have a slug — legacy rows created
          // before Week 2 don't get click-through, they just show the
          // card. TS doesn't like a polymorphic `Link | "div"` so we do
          // this as an explicit ternary at the return site.
          return it.slug ? (
            <Link key={it.id} href={`/news/${it.slug}`} className="group block">
              {body}
            </Link>
          ) : (
            <div key={it.id} className="block">
              {body}
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="col-span-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
            Одоогоор мэдээ байхгүй
          </div>
        )}
      </div>
    </SectionShell>
  );
}
