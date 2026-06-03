import Link from "next/link";
import Logo from "./Logo";
import HeaderActions from "./HeaderActions";

export default function AppHeader() {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md transition-opacity hover:opacity-80"
        >
          <Logo size={36} priority />
          <span className="hidden truncate text-sm font-semibold tracking-tight sm:inline sm:text-base">
            Нийслэлийн ерөнхий боловсролын 3-р Сургууль
          </span>
        </Link>
        <div className="shrink-0">
          <HeaderActions />
        </div>
      </div>
    </div>
  );
}
