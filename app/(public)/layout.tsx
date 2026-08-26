import PublicSidebar from "@/components/home/PublicSidebar";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SidebarProvider } from "@/components/home/SidebarContext";
import SidebarMargin from "@/components/home/SidebarMargin";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background text-foreground">
        <a href="#main-content" className="skip-to-content">
          Гол агуулга руу шилжих
        </a>
        <PublicSidebar />
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
