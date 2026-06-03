import { prisma } from "@/lib/prisma";
import { getCurrentUser, roleHomePath } from "@/lib/session";
import { redirect } from "next/navigation";
import LoginHeader from "./LoginHeader";
import UserPicker from "./UserPicker";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

export default async function LoginPage() {
  const me = await getCurrentUser();
  if (me) {
    redirect(roleHomePath(me.role));
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, position: true, role: true },
  });

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          <LoginHeader />

          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-border">
            <UserPicker
              teachers={users.filter((u) => u.role === "TEACHER")}
              approvers={users.filter((u) => u.role === "APPROVER")}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}