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

export const metadata: Metadata = {
  title: "Монгол 3-р сургууль · Албан ёсны хуудас",
  description: "Монгол 3-р сургуулийн танилцуулга, түүх, виртуал аялал, анги бүлэг, сургалтын чанар, хүүхэд хамгааллын албан ёсны цахим хуудас.",
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
