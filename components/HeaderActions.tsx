import Link from "next/link";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoutButton from "./LogoutButton";

export default function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/settings">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Тохиргоо</span>
        </Link>
      </Button>
      <LogoutButton />
    </div>
  );
}
