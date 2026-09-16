import { getCurrentUser, roleHomePath } from "@/lib/session";
import { redirect } from "next/navigation";
import LoginHeader from "./LoginHeader";
import UserPicker from "./UserPicker";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

export default async function LoginPage() {
  const me = await getCurrentUser();
  if (me) {
    redirect(roleHomePath(me.role, me.position));
  }

  // NOTE: Intentionally NO bulk user query here. The staff roster is no
  // longer exposed to unauthenticated visitors — the client searches for a
  // single user on demand via the rate-limited `searchUsers` server action.

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          <LoginHeader />

          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-border">
            <UserPicker />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
