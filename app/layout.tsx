import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Фонт нэмэх нь UI-г илүү гоё харагдуулна
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

// Google фонт ашиглах (Tailwind-д тохируулсан бол)
const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Амралтын олговрог баталгаажуулах систем",
  description: "Багш нарын амралтын олговрог хянах, баталгаажуулах нэгдсэн систем.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className="scroll-smooth">
      <body className={cn(
        "min-h-screen bg-slate-50 font-sans text-slate-900 antialiased",
        inter.className
      )}>
        {children}


        <Toaster richColors position="top-right" />


        <footer className="fixed bottom-4 right-4 z-50">
          
        </footer>
      </body>
    </html>
  );
}