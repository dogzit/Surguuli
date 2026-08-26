import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LoadingBar } from "@/components/home/LoadingBar";
import { ScrollToTop } from "@/components/home/ScrollToTop";
import { NavigationLoader } from "@/components/home/NavigationLoader";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Нийслэлийн ерөнхий боловсролын 3-р сургууль · Албан ёсны хуудас",
    template: "%s · Нийслэлийн ерөнхий боловсролын 3-р сургууль",
  },
  description:
    "Нийслэлийн ерөнхий боловсролын 3-р сургуулийн танилцуулга, түүх, виртуал аялал, анги бүлэг, сургалтын чанар, хүүхэд хамгааллын албан ёсны цахим хуудас.",
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: "Нийслэлийн ерөнхий боловсролын 3-р сургууль",
    title: "Нийслэлийн ерөнхий боловсролын 3-р сургууль · Албан ёсны хуудас",
    description:
      "1921 онд байгуулагдсан Монголын анхны олон нийтийн сургуулиудын нэг.",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "Нийслэлийн ерөнхий боловсролын 3-р сургууль",
    description:
      "1921 онд байгуулагдсан Монголын анхны олон нийтийн сургуулиудын нэг.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
  },
};

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
        </ThemeProvider>
      </body>
    </html>
  );
}
