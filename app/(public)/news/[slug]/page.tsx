import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { loadNewsBySlug } from "@/lib/site-data";
import { loadSchoolName } from "@/lib/school-info";
import { SectionShell } from "@/components/home/SectionShell";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const [item, schoolName] = await Promise.all([
    loadNewsBySlug(params.slug),
    loadSchoolName(),
  ]);
  if (!item) return { title: "Мэдээ олдсонгүй" };
  return {
    title: schoolName ? `${item.title} · ${schoolName}` : item.title,
    description: item.excerpt,
    openGraph: {
      title: item.title,
      description: item.excerpt,
      images: item.coverImage ? [item.coverImage] : undefined,
      type: "article",
      publishedTime: item.publishedAt ?? item.date,
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = await loadNewsBySlug(params.slug);
  if (!item) notFound();

  const date = new Date(item.publishedAt ?? item.date);
  const dateLabel = date.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <SectionShell id="news-detail" tone="light" eyebrow="Мэдээ" title={item.title}>
      <article className="mx-auto max-w-3xl">
        <Link
          href="/news"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Бүх мэдээ рүү буцах
        </Link>

        {/* Meta line */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {item.tag && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Tag className="h-3 w-3" />
              {item.tag}
            </span>
          )}
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Calendar className="h-3 w-3" />
            {dateLabel}
          </span>
        </div>

        {/* Cover image */}
        {item.coverImage && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-border/50 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.coverImage}
              alt={item.title}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        {/* Excerpt as lede */}
        {item.excerpt && (
          <p className="mb-6 text-lg leading-relaxed text-foreground/90">
            {item.excerpt}
          </p>
        )}


        {/* Rich body */}
        {item.body ? (
          <div
            className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-primary/60 prose-blockquote:italic prose-img:rounded-xl prose-img:border prose-img:border-border/50"
            // The `body` field is passed through `sanitizeRichHtml` on
            // write in updateNewsItem/createNewsItem, so injecting it
            // here is safe from XSS. Never render user HTML that hasn't
            // been sanitized.
            dangerouslySetInnerHTML={{ __html: item.body }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Дэлгэрэнгүй мэдээлэл нэмэгдээгүй байна.
          </p>
        )}
      </article>
    </SectionShell>
  );
}
