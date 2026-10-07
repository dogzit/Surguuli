import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionShell } from "./SectionShell";

interface Props {
  eyebrow: string;
  title: string;
  body: string;
  /** What the user should do meanwhile. */
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Shared "under construction" surface used by /budget, /schedule,
 * /teacher-eval, /time-calc. These pages are hidden from the primary
 * nav but stay reachable (old bookmarks, direct URLs) with a polished
 * message rather than a raw dashed box.
 */
export function ComingSoonSection({ eyebrow, title, body, ctaLabel, ctaHref }: Props) {
  return (
    <SectionShell id="coming-soon" tone="light" eyebrow={eyebrow} title={title}>
      <Card className="mx-auto max-w-2xl overflow-hidden">
        <div className="border-b border-border/50 bg-gradient-to-br from-primary/[0.08] via-primary/[0.02] to-transparent p-8 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20">
            <Clock className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">
            Удахгүй нээгдэнэ
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {body}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Нүүр хуудас
            </Link>
          </Button>
          {ctaLabel && ctaHref && (
            <Button size="sm" asChild>
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          )}
        </div>
      </Card>
    </SectionShell>
  );
}
