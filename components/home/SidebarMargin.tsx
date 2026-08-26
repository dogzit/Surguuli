"use client";

import { type ReactNode } from "react";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

export default function SidebarMargin({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className={cn(
      "flex flex-1 flex-col overflow-y-auto transition-all duration-300",
      collapsed ? "lg:ml-16" : "lg:ml-64"
    )}>
      {children}
    </div>
  );
}
