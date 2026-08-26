"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";

interface UserInfo {
  name: string;
  position: string;
}

export default function ApproverLanding() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
        // Auto-redirect to admin dashboard
        router.push("/dashboard/admin");
      })
      .catch(() => {
        setLoading(false);
        router.push("/");
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <motion.div
              className="h-16 w-16 rounded-2xl bg-primary/10"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-6 w-6 text-primary" />
            </motion.div>
          </div>
          <p className="text-sm text-muted-foreground">Ачааллаж байна...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
          <Logo size={56} priority />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {user?.name || "Баталгаажуулагч"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.position || "Албан тушаал"}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Админ хяналтын хуудас руу шилжж байна...
        </p>
      </motion.div>
    </div>
  );
}
