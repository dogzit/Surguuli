"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline" size="sm">
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Гарах</span>
      </Button>
    </form>
  );
}
