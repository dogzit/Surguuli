import { ShieldCheck } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8 border-t border-border/60 bg-muted/20">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4 py-6 text-center text-[10px] text-muted-foreground sm:flex-row sm:justify-between sm:text-xs">

        {/* Зохиогчийн эрх */}
        <div className="flex flex-col items-center gap-1 sm:flex-row">
          <div className="flex items-center gap-1.5 font-medium text-foreground/80">
            <ShieldCheck className="h-3 w-3 text-primary" />
            <span>© {year} 3-р Сургууль</span>
          </div>
          <span className="hidden sm:inline">|</span>
          <span className="text-[10px]">Бүх эрх хуулиар хамгаалагдсан.</span>
        </div>

        {/* Хөгжүүлэгчийн мэдээлэл */}
        <div className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 shadow-sm ring-1 ring-border/50">
          <span className="text-blue-500 font-mono text-[9px]">{"< >"}</span>
          <span className="text-muted-foreground/90">
            Хөгжүүлсэн: <span className="font-semibold text-foreground">11д Б.Золбаяр</span>
          </span>
        </div>

      </div>
    </footer>
  );
}