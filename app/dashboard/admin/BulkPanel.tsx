"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  KeyRound,
  RotateCcw,
  Database,
  Shield,
  Users,
  FileSignature,
  Info,
} from "lucide-react";
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
      if (res.ok) { toast.success(res.message ?? "Шинэчлэгдлээ"); close(); }
      else toast.error(res.error);
    });
  };

  const doClearSignatures = () => {
    start(async () => {
      const res = await clearAllSignatures();
      if (res.ok) { toast.success(res.message ?? "Устгалаа"); close(); }
      else toast.error(res.error);
    });
  };

  return (
    <div>
      {/* System Info */}
      <div className="mb-6 rounded-2xl border border-border/50 bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Системийн мэдээлэл</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <InfoItem icon={<Users className="h-4 w-4" />} label="Хэрэглэгчид" value={userCount} />
          <InfoItem icon={<FileSignature className="h-4 w-4" />} label="Гарын үсэг" value={signatureCount} />
          <InfoItem icon={<Shield className="h-4 w-4" />} label="Баталгаажуулагчид" value={7} />
          <InfoItem icon={<KeyRound className="h-4 w-4" />} label="Анхдагч PIN" value="0000" />
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Анхааруулга</h4>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Эдгээр үйлдлүүд нь буцаах боломжгүй байж магадгүй. Зөвхөн шаардлагатай үед ашиглана уу.
            </p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-border/50 bg-amber-50 px-5 py-3 dark:bg-amber-500/10">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold">Бүх PIN-г сэргээх</h3>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-muted-foreground">
              Бүх хэрэглэгчийн (Админаас бусад) PIN-г шинэ нэг утга руу шинэчилнэ.
            </p>
            <div className="mt-3 rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Нөлөөлөх хэрэглэгчид:</span>
                <span className="font-semibold">{userCount} хүн</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setConfirm("pins")}
              disabled={pending}
            >
              PIN бүгдийг сэргээх...
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border/50 bg-rose-50 px-5 py-3 dark:bg-rose-500/10">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <h3 className="text-sm font-semibold">Гарын үсгүүдийг устгах</h3>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-muted-foreground">
              Бүх гарын үсгийг устгана. Багш нар дахин 0 явцтай эхэлнэ. Шинэ улирлын эхэнд ашиглана.
            </p>
            <div className="mt-3 rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Устгагдах гарын үсэг:</span>
                <span className="font-semibold">{signatureCount} ширхэг</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirm("signatures")}
              disabled={pending || signatureCount === 0}
            >
              Бүгдийг устгах...
            </Button>
          </div>
        </Card>
      </div>

      {/* PIN Dialog */}
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
            <Input id="bulk-pin" value={pinValue} onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" maxLength={8} placeholder="0000" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={pending}>Болих</Button>
            <Button onClick={doResetPins} disabled={pending || pinValue.length < 4}>
              {pending ? "Шинэчилж байна..." : "Шинэчлэх"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={confirm === "signatures"} onOpenChange={(v) => !v && close()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center">Гарын үсгийг бүгдийг устгах уу?</DialogTitle>
            <DialogDescription className="text-center">
              {signatureCount} ширхэг гарын үсэг устах болно. Энэ үйлдлийг буцаах боломжгүй.
              Баталгаажуулахын тулд доор{" "}
              <span className="font-mono font-bold text-foreground">УСТГАХ</span>{" "}
              гэж бичнэ үү.
            </DialogDescription>
          </DialogHeader>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="УСТГАХ" className="text-center font-mono" />
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={pending}>Болих</Button>
            <Button variant="destructive" onClick={doClearSignatures} disabled={pending || confirmText !== "УСТГАХ"}>
              {pending ? "Устгаж байна..." : "Бүгдийг устгах"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
}
