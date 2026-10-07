import PublicSidebar from "@/components/home/PublicSidebar";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SidebarProvider } from "@/components/home/SidebarContext";
import SidebarMargin from "@/components/home/SidebarMargin";
import { loadSchoolInfoBundle } from "@/lib/school-info";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const info = await loadSchoolInfoBundle();
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background text-foreground">
        <a href="#main-content" className="skip-to-content">
          Гол агуулга руу шилжих
        </a>
        <PublicSidebar schoolName={info.name} />
        <SidebarMargin>
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <SiteFooter />
        </SidebarMargin>
      </div>
    </SidebarProvider>
  );
}
