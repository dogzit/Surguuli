"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, Loader2, Newspaper, Trophy, Calendar, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Hit {
  id: string;
  slug?: string | null;
  title: string;
  snippet: string;
  meta?: string | null;
  date?: string | null;
}

interface Results {
  news: Hit[];
  achievements: Hit[];
  events: Hit[];
  faqs: Hit[];
}

const EMPTY: Results = { news: [], achievements: [], events: [], faqs: [] };

/**
 * Client-side surface: keeps its own input state, POSTs to /api/search,
 * renders grouped results. Server page owns the ?q= URL bit so users
 * can share links to specific searches.
 */
export function SearchInline({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const urlQ = search.get("q") ?? initialQuery ?? "";
  const [q, setQ] = useState(urlQ);
  const [results, setResults] = useState<Results>(EMPTY);
  const [pending, start] = useTransition();

  // Fetch whenever the URL query changes.
  useEffect(() => {
    const trimmed = urlQ.trim();
    if (trimmed.length < 2) {
      setResults(EMPTY);
      return;
    }
    let cancelled = false;
    start(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json();
        if (!cancelled && json?.results) setResults(json.results);
      } catch {
        if (!cancelled) setResults(EMPTY);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [urlQ]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const total =
    results.news.length +
    results.achievements.length +
    results.events.length +
    results.faqs.length;

  return (
    <div>
      <form onSubmit={submit} className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Хайх түлхүүр үг…"
          className="h-12 rounded-2xl pl-11 pr-24 text-base"
          autoFocus
        />
        <button
          type="submit"
          disabled={pending || q.trim().length < 2}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition",
            "disabled:opacity-40",
          )}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Хайх"}
        </button>
      </form>

      {urlQ.trim().length >= 2 && (
        <div className="mt-8 space-y-8">
          <p className="text-xs text-muted-foreground">
            {pending ? "Хайж байна…" : `${total} үр дүн`}
          </p>

          {total === 0 && !pending && (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-10 text-center">
              <p className="text-sm text-muted-foreground">Тохирох агуулга олдсонгүй.</p>
            </div>
          )}

          <ResultGroup
            title="Мэдээ"
            icon={<Newspaper className="h-4 w-4 text-violet-500" />}
            hits={results.news}
            hrefFor={(h) => (h.slug ? `/news/${h.slug}` : "/news")}
          />
          <ResultGroup
            title="Амжилтууд"
            icon={<Trophy className="h-4 w-4 text-amber-500" />}
            hits={results.achievements}
          />
          <ResultGroup
            title="Үйл явдал"
            icon={<Calendar className="h-4 w-4 text-orange-500" />}
            hits={results.events}
          />
          <ResultGroup
            title="Түгээмэл асуулт"
            icon={<HelpCircle className="h-4 w-4 text-indigo-500" />}
            hits={results.faqs}
          />
        </div>
      )}
    </div>
  );
}

function ResultGroup({
  title,
  icon,
  hits,
  hrefFor,
}: {
  title: string;
  icon: React.ReactNode;
  hits: Hit[];
  hrefFor?: (h: Hit) => string;
}) {
  if (hits.length === 0) return null;
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
        <span className="text-xs text-muted-foreground">{hits.length}</span>
      </h3>
      <ul className="space-y-2">
        {hits.map((h) => {
          const inner = (
            <div className="rounded-xl border border-border/50 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{h.title}</p>
                {h.meta && (
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {h.meta}
                  </span>
                )}
              </div>
              {h.snippet && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{h.snippet}</p>
              )}
            </div>
          );
          return (
            <li key={h.id}>
              {hrefFor ? (
                <Link href={hrefFor(h)} className="block">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
