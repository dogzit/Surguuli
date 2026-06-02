"use client";

import { useState, useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LogoutButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const confirm = () => {
    start(async () => {
      await logout();
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Гарах</span>
      </Button>

      <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
              className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
            >
              <LogOut className="h-5 w-5" />
            </motion.div>
            <DialogTitle className="text-center">Системээс гарах уу?</DialogTitle>
            <DialogDescription className="text-center">
              Та дахин нэвтэрч орохын тулд PIN кодоо оруулах шаардлагатай болно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="sm:min-w-[110px]"
            >
              Болих
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirm}
              disabled={pending}
              className="sm:min-w-[110px]"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="mr-1 h-4 w-4" />
                  Гарах
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
