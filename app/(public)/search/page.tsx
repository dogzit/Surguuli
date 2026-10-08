import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { SectionShell } from "@/components/home/SectionShell";
import { loadSchoolName } from "@/lib/school-info";
import { SearchInline } from "./SearchInline";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { q?: string };
}): Promise<Metadata> {
  const name = await loadSchoolName();
  const q = searchParams?.q?.trim();
  return {
    title: q
      ? `"${q}" — хайлт${name ? " · " + name : ""}`
      : name
        ? `Хайлт · ${name}`
        : "Хайлт",
    robots: { index: false, follow: true },
  };
}

export default function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const q = (searchParams?.q ?? "").trim();

  return (
    <SectionShell
      id="search"
      tone="light"
      eyebrow="Хайлт"
      title={q ? `"${q}" гэсэн хайлт` : "Сайтын дотор хайх"}
    >
      <div className="mx-auto max-w-3xl">
        <SearchInline initialQuery={q} />

        {!q && (
          <div className="mt-8 rounded-2xl border border-border/50 bg-card p-8 text-center">
            <SearchIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              Мэдээ, амжилт, үйл явдал, түгээмэл асуултаас нэгэн зэрэг хайна.
              Хамгийн багадаа 2 тэмдэгт бичээрэй.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
              {["олимпиад", "нээлт", "хичээл", "багш"].map((sample) => (
                <Link
                  key={sample}
                  href={`/search?q=${encodeURIComponent(sample)}`}
                  className="rounded-full border border-border/50 bg-background px-3 py-1 text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                >
                  {sample}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
