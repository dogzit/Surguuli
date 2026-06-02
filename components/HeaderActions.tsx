"use client";

import Link from "next/link";
import { Settings, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";

export default function HeaderActions({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
          >
            <Link href="/dashboard/admin">
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">Админ</span>
            </Link>
          </Button>
        </motion.div>
      )}
      <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
        <ThemeToggle />
      </motion.div>
      <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Тохиргоо</span>
          </Link>
        </Button>
      </motion.div>
      <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
        <LogoutButton />
      </motion.div>
    </div>
  );
}
