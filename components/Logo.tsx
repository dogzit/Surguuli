"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  size?: number;
  className?: string;
  priority?: boolean;
  // Callers that already know the school name (server pages that loaded
  // SchoolInfo) should pass it here for accessibility. Falls back to a
  // generic label rather than a specific school name.
  alt?: string;
}

export default function Logo({ size = 40, className, priority, alt }: Props) {
  return (
    <Image
      src="/logo.png"
      alt={alt ?? "Сургуулийн лого"}
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 rounded-lg", className)}
    />
  );
}
