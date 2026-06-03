"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";

export default function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
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
