"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import StudentLoginForm from "./StudentLoginForm";
import ParentLoginForm from "./ParentLoginForm";

// Staff sign in on the separate staff site (linked below the card).
type Role = "student" | "parent";

const TABS: Array<{ id: Role; label: string; icon: typeof GraduationCap; accent: string }> = [
  { id: "student", label: "Сурагч", icon: GraduationCap, accent: "text-emerald-600 dark:text-emerald-400" },
  { id: "parent", label: "Эцэг эх", icon: Users, accent: "text-indigo-600 dark:text-indigo-400" },
];

export default function RolePicker() {
  const [role, setRole] = useState<Role>("student");

  return (
    <div>
      {/* Role tabs */}
      <div className="grid grid-cols-2 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = role === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setRole(t.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 py-3 text-xs font-medium transition",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", active && t.accent)} />
              <span>{t.label}</span>
              {active && (
                <motion.span
                  layoutId="role-underline"
                  className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={role}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {role === "student" && <StudentLoginForm />}
          {role === "parent" && <ParentLoginForm />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
