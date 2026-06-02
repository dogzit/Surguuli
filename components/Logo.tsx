import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  size?: number;
  className?: string;
  priority?: boolean;
}

export default function Logo({ size = 40, className, priority }: Props) {
  return (
    <Image
      src="/logo.png"
      alt="Нийслэлийн Сургууль"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0", className)}
    />
  );
}
