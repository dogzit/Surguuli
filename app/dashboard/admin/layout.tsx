import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await canAccessAdmin();
  // NOTE: do NOT redirect here when !access.allowed. The root `/dashboard/admin`
  // page renders <AdminGate /> as its own body when a visitor isn't yet
  // signed in, and that gate is the only place the admin PIN can be
  // entered. Redirecting away from the layout stole that entry point.
  //
  // Sub-pages (users, codes, audit, ...) each still call `canAccessAdmin`
  // themselves and either render <AdminGate role={...}/> or the panel, so
  // authorisation is still enforced page-by-page.
  const role = access.role === "ADMIN" ? "ADMIN" : "APPROVER";
  const newFeedback =
    role === "ADMIN"
      ? await prisma.feedback.count({ where: { status: "new" } }).catch(() => 0)
      : 0;

  return (
    <div className="flex h-screen">
      {access.allowed && (
        <AdminSidebar role={role} badges={{ "/dashboard/admin/feedback": newFeedback }} />
      )}
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
