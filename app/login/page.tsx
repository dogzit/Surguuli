import { redirect } from "next/navigation";
import { actorHomePath, getCurrentActor } from "@/lib/session";
import LoginHeader from "./LoginHeader";
import RolePicker from "./RolePicker";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

export default async function LoginPage() {
  // Anyone already logged in — staff, student, or parent — gets bounced
  // straight to their own dashboard.
  const actor = await getCurrentActor();
  if (actor) {
    redirect(actorHomePath(actor));
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          <LoginHeader />

          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-border">
            <RolePicker />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
