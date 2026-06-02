import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import UserPicker from "./UserPicker";

export default async function LoginPage() {
  const me = await getCurrentUser();
  if (me) {
    redirect(me.role === "APPROVER" ? "/dashboard/approver" : "/dashboard/teacher");
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, position: true, role: true },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Системд нэвтрэх
          </h1>
          <p className="mt-2 text-slate-500">
            Өөрийн нэрээ сонгоод PIN кодоо оруулна уу
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-slate-200">
          <UserPicker
            teachers={users.filter((u) => u.role === "TEACHER")}
            approvers={users.filter((u) => u.role === "APPROVER")}
          />
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg backdrop-blur-sm transition-all hover:bg-slate-950">
        <span className="text-blue-400">{"< >"}</span>
        <span>Хөгжүүлсэн: 11д Б.Золбаяр</span>
      </div>
    </main>
  );
}