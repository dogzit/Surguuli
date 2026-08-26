import { canAccessAdmin } from "@/lib/admin";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await canAccessAdmin();

  return (
    <div className="flex min-h-screen">
      {access.allowed && <AdminSidebar />}
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
