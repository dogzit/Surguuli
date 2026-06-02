"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, KeyRound, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearAllSignatures, resetAllPins } from "@/app/actions/admin";

type Confirm = "pins" | "signatures" | null;

export default function BulkPanel({
  signatureCount,
  userCount,
}: {
  signatureCount: number;
  userCount: number;
}) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [pinValue, setPinValue] = useState("0000");
  const [confirmText, setConfirmText] = useState("");

  const close = () => {
    if (pending) return;
    setConfirm(null);
    setConfirmText("");
    setPinValue("0000");
  };

  const doResetPins = () => {
    start(async () => {
      const res = await resetAllPins(pinValue);
      if (res.ok) {
        toast.success(res.message ?? "Шинэчлэгдлээ");
        close();
      } else {
        toast.error(res.error);
      }
    });
  };

  const doClearSignatures = () => {
    start(async () => {
      const res = await clearAllSignatures();
      if (res.ok) {
        toast.success(res.message ?? "Устгалаа");
        close();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <KeyRound className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">Бүх PIN-г сэргээх</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Бүх хэрэглэгчийн (Админаас бусад) PIN-г шинэ нэг утга руу шинэчилнэ.
          {userCount} хэрэглэгчид нөлөөлнө.
        </p>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => setConfirm("pins")}
          disabled={pending}
        >
          PIN бүгдийг сэргээх...
        </Button>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            <RotateCcw className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">Гарын үсгүүдийг устгах</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Бүх гарын үсгийг (одоогоор {signatureCount} ширхэг) устгана. Багш нар
          дахин 0 явцтай эхэлнэ. Шинэ улирлын эхэнд ашиглана.
        </p>
        <Button
          variant="outline"
          className="mt-4 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirm("signatures")}
          disabled={pending || signatureCount === 0}
        >
          Бүгдийг устгах...
        </Button>
      </Card>

      <Dialog open={confirm === "pins"} onOpenChange={(v) => !v && close()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center">PIN-г бүгдэд нь шинэчилэх</DialogTitle>
            <DialogDescription className="text-center">
              Бүх хэрэглэгчийн (Админаас бусад) PIN дараах утга болно.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-pin">Шинэ PIN</Label>
            <Input
              id="bulk-pin"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 8))}
              inputMode="numeric"
              maxLength={8}
              placeholder="0000"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={pending}>
              Болих
            </Button>
            <Button onClick={doResetPins} disabled={pending || pinValue.length < 4}>
              {pending ? "Шинэчилж байна..." : "Шинэчлэх"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirm === "signatures"} onOpenChange={(v) => !v && close()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center">Гарын үсгийг бүгдийг устгах уу?</DialogTitle>
            <DialogDescription className="text-center">
              {signatureCount} ширхэг гарын үсэг устах болно. Энэ үйлдлийг буцаах
              боломжгүй. Баталгаажуулахын тулд доор{" "}
              <span className="font-mono font-bold text-foreground">УСТГАХ</span>{" "}
              гэж бичнэ үү.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="УСТГАХ"
            className="text-center font-mono"
          />
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={pending}>
              Болих
            </Button>
            <Button
              variant="destructive"
              onClick={doClearSignatures}
              disabled={pending || confirmText !== "УСТГАХ"}
            >
              {pending ? "Устгаж байна..." : "Бүгдийг устгах"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
