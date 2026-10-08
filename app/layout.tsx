import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LoadingBar } from "@/components/home/LoadingBar";
import { ScrollToTop } from "@/components/home/ScrollToTop";
import { NavigationLoader } from "@/components/home/NavigationLoader";
import PWARegister from "@/components/PWARegister";
import { cn } from "@/lib/utils";
import { loadSchoolInfoBundle } from "@/lib/school-info";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Root metadata is derived from SchoolInfo so a rename in the DB flows
// everywhere. Individual pages can override title/description as usual.
export async function generateMetadata(): Promise<Metadata> {
  const info = await loadSchoolInfoBundle();
  const name = info.name ?? "Албан ёсны хуудас";
  const shortName = info.shortName ?? name;
  const desc = info.foundedYear
    ? `${info.foundedYear} онд байгуулагдсан ${name}-ийн албан ёсны цахим хуудас.`
    : `${name}-ийн албан ёсны цахим хуудас.`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${name} · Албан ёсны хуудас`,
      template: `%s · ${shortName}`,
    },
    description: desc,
    openGraph: {
      type: "website",
      locale: "mn_MN",
      siteName: name,
      title: `${name} · Албан ёсны хуудас`,
      description: desc,
      images: ["/logo.png"],
    },
    twitter: {
      card: "summary",
      title: name,
      description: desc,
      images: ["/logo.png"],
    },
    icons: {
      icon: "/logo.png",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          inter.className,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LoadingBar />
          <NavigationLoader />
          {children}
          <ScrollToTop />
          <Toaster richColors position="top-right" />
          <PWARegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
