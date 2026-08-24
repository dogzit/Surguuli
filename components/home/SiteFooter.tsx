import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";

const COL_QUICK = [
  { href: "/about", label: "Танилцуулга" },
  { href: "/classes", label: "Анги бүлэг" },
  { href: "/quality", label: "Сургалтын чанар" },
  { href: "/tour", label: "Виртуал аялал" },
];

const COL_STUDENTS = [
  { href: "/news", label: "Мэдээ, зарлал" },
  { href: "/protection", label: "Хүүхэд хамгаалал" },
  { href: "/contact", label: "Холбоо барих" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8 border-t border-border/60 bg-muted/20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo size={36} />
            <div className="leading-tight">
              <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Улаанбаатар · Сүхбаатар дүүрэг
              </div>
              <div className="text-sm font-semibold text-foreground">
                3 дугаар сургууль
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Албан ёсны цахим хуудас. Сургалт, судалгаа, хүүхэд хамгааллын
            бодлого, захиргааны ил тод байдлыг эрхэмлэдэг байгууллага.
          </p>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Хуудсууд
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {COL_QUICK.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-foreground/80 transition hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Сурагч, эцэг эх
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {COL_STUDENTS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-foreground/80 transition hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Хаяг, холбоо
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Сүхбаатар дүүрэг, 10-р хороо</li>
            <li>Утас: (976) 7011-1180</li>
            <li>И-мэйл: uuriingegee22@gmail.com</li>
            <li>Ажлын цаг: Дав—Баа · 08:00—17:00</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 bg-background/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4 py-4 text-center text-[10px] text-muted-foreground sm:flex-row sm:justify-between sm:text-xs sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-1 sm:flex-row">
            <div className="flex items-center gap-1.5 font-medium text-foreground/80">
              <ShieldCheck className="h-3 w-3 text-primary" />
              <span>© {year} 3-р Сургууль</span>
            </div>
            <span className="hidden sm:inline">|</span>
            <span className="text-[10px]">Бүх эрх хуулиар хамгаалагдсан.</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 shadow-sm ring-1 ring-border/50">
            <span className="font-mono text-[9px] text-blue-500">{"< >"}</span>
            <span className="text-muted-foreground/90">
              Хөгжүүлсэн:{" "}
              <span className="font-semibold text-foreground">12д Б.Золбаяр</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
