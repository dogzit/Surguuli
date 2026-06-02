"use client";

import { motion } from "framer-motion";
import Logo from "@/components/Logo";

export default function LoginHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-center text-center"
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.05, type: "spring", stiffness: 200, damping: 14 }}
        className="relative mb-4 flex h-20 w-20 items-center justify-center"
      >
        <motion.span
          aria-hidden
          className="absolute -inset-16 rounded-full bg-primary/70 blur-3xl"
          animate={{ opacity: [0.45, 0.75, 0.45], scale: [1, 1.2, 1] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          aria-hidden
          className="absolute -inset-10 rounded-full bg-primary/60 blur-2xl"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.3, 1] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
        />
        <span className="relative flex h-20 w-20 items-center justify-center">
          <Logo size={80} priority className="drop-shadow-lg" />
        </span>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="text-3xl font-bold tracking-tight text-foreground"
      >
        Системд нэвтрэх
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.22 }}
        className="mt-2 text-muted-foreground"
      >
        Өөрийн нэрээ сонгоод PIN кодоо оруулна уу
      </motion.p>
    </motion.div>
  );
}
