import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="h-8 w-8" />
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Хуудас олдсонгүй
        </h1>
        <p className="text-sm text-muted-foreground">
          Таны хайсан хуудас байхгүй эсвэл устгагдсан байна.
        </p>
      </div>
      <Button asChild>
        <Link href="/">
          <Home className="h-4 w-4" />
          Нүүр хуудас руу буцах
        </Link>
      </Button>
    </main>
  );
}
