import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { actorHomePath, getCurrentActor } from "@/lib/session";
import { STAFF_SITE_URL } from "@/lib/staff-site";
import LoginHeader from "./LoginHeader";
import RolePicker from "./RolePicker";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

export default async function LoginPage() {
  // A signed-in student or parent goes straight to their own dashboard.
  const actor = await getCurrentActor();
  if (actor) {
    redirect(actorHomePath(actor));
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Link
        href="/"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-accent hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Нүүр хуудас</span>
      </Link>
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          <LoginHeader />

          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-border">
            <RolePicker />
          </div>

          {STAFF_SITE_URL && (
            <p className="text-center text-sm text-muted-foreground">
              Багш, ажилтан уу?{" "}
              <a
                href={STAFF_SITE_URL}
                className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
              >
                Багш, ажилтны систем
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
