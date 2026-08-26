"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, MessageSquare, PenLine, Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  addSignature,
  removeSignature,
  updateSignatureNote,
} from "@/app/actions/signatures";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  teacherId: string;
  teacherName: string;
  currentNote: string | null;
  alreadySigned: boolean;
  complete: boolean;
}

export default function ApproveButton({
  teacherId,
  teacherName,
  currentNote,
  alreadySigned,
  complete,
}: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(currentNote ?? "");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (open) setNote(currentNote ?? "");
  }, [open, currentNote]);

  const close = () => setOpen(false);

  const run = (fn: () => Promise<unknown>, successMsg: string) =>
    start(async () => {
      try {
        await fn();
        close();
        toast.success(successMsg);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Алдаа гарлаа");
      }
    });

  const trigger = alreadySigned ? (
    <Button variant="success" size="sm" onClick={() => setOpen(true)}>
      <Check className="h-3.5 w-3.5" />
      Зурсан
      {currentNote && <MessageSquare className="h-3 w-3 opacity-70" />}
    </Button>
  ) : complete ? (
    <Button variant="secondary" size="sm" disabled>
      Дууссан
    </Button>
  ) : (
    <Button size="sm" onClick={() => setOpen(true)}>
      <PenLine className="h-3.5 w-3.5" />
      Гарын үсэг зурах
    </Button>
  );

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {alreadySigned ? "Гарын үсэг засах" : "Гарын үсэг зурах"}
            </DialogTitle>
            <DialogDescription>{teacherName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="note">Тайлбар (заавал биш)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Жишээ: эмчилгээний шалтгаанаар, баталгаажуулсан..."
              rows={4}
              maxLength={500}
              autoFocus
            />
            <div className="text-right text-xs text-muted-foreground tabular-nums">
              {note.length}/500
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={close} disabled={pending}>
              Хаах
            </Button>
            {alreadySigned && (
              <Button
                variant="outline"
                onClick={() =>
                  run(
                    () => removeSignature(teacherId),
                    "Гарын үсгийг буцаалаа",
                  )
                }
                disabled={pending}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Буцаах
              </Button>
            )}
            <Button
              onClick={() =>
                run(
                  () =>
                    alreadySigned
                      ? updateSignatureNote(teacherId, note)
                      : addSignature(teacherId, note),
                  alreadySigned
                    ? "Тайлбар хадгалагдлаа"
                    : "Гарын үсэг зурлаа",
                )
              }
              disabled={pending}
            >
              {pending ? (
                "Хадгалж байна..."
              ) : alreadySigned ? (
                "Хадгалах"
              ) : (
                <>
                  <PenLine className="h-3.5 w-3.5" />
                  Зурах
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
