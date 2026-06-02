import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex-1">
        <PageTransition>{children}</PageTransition>
      </div>
      <Footer />
    </div>
  );
}
