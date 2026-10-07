"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Bookmark, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { toggleBookmark } from "@/app/actions/community";

interface Item {
  id: string;
  slug: string | null;
  tag: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  date: string;
}

export function BookmarksSection({ items }: { items: Item[] }) {
  const [pending, start] = useTransition();

  if (items.length === 0) {
    return (
      <Card className="mb-6 border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Мэдээний хажуу дахь <Bookmark className="mx-1 inline h-3.5 w-3.5" /> товч дээр дарж хадгална уу.
        </p>
      </Card>
    );
  }

  return (
    <div className="mb-6 grid gap-3 md:grid-cols-2">
      {items.map((it) => {
        const body = (
          <Card className="flex h-full overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
            {it.coverImage && (
              <div className="hidden w-24 shrink-0 bg-muted sm:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.coverImage} alt={it.title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                      {it.tag}
                    </span>
                    <time className="tabular-nums">
                      {new Date(it.date).toLocaleDateString("mn-MN")}
                    </time>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">{it.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{it.excerpt}</p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    start(async () => {
                      const res = await toggleBookmark("news", it.id);
                      if (res.ok) toast.success(res.message ?? "");
                      else toast.error(res.error);
                    });
                  }}
                  className="rounded-md border border-border/50 bg-background p-1.5 text-muted-foreground transition hover:text-destructive hover:bg-destructive/10"
                  title="Хадгалалт цуцлах"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Card>
        );
        return it.slug ? (
          <Link key={it.id} href={`/news/${it.slug}`} className="block">
            {body}
          </Link>
        ) : (
          <div key={it.id}>{body}</div>
        );
      })}
    </div>
  );
}
