"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeOff, Loader2, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitFeedback, type FeedbackFormState } from "@/app/actions/feedback";
import { FEEDBACK_KINDS, FEEDBACK_TOPICS } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const INITIAL_STATE: FeedbackFormState = { ok: false, message: "" };

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function FeedbackForm({ signedInAs }: { signedInAs: string | null }) {
  const [state, formAction] = useFormState(submitFeedback, INITIAL_STATE);
  const [kind, setKind] = useState<string>(FEEDBACK_KINDS[0].id);
  const [anonymous, setAnonymous] = useState(false);
  // Bumped once per successful submit to clear the uncontrolled inputs.
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      setFormKey((k) => k + 1);
      setKind(FEEDBACK_KINDS[0].id);
      setAnonymous(false);
      // Pull the new row into "my feedback" for signed-in senders.
      router.refresh();
    } else if (!state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state, router]);

  const err = state.fieldErrors ?? {};

  return (
    <Card className="p-6">
      <form action={formAction} key={formKey} className="space-y-5">
        <fieldset>
          <legend className="text-sm font-medium text-foreground">Төрөл</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {FEEDBACK_KINDS.map((k) => (
              <label
                key={k.id}
                className={cn(
                  "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  kind === k.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="kind"
                  value={k.id}
                  checked={kind === k.id}
                  onChange={() => setKind(k.id)}
                  className="sr-only"
                />
                {k.label}
              </label>
            ))}
          </div>
          {err.kind && <p className="mt-1 text-xs text-destructive">{err.kind}</p>}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fb-topic">Сэдэв</Label>
            <select id="fb-topic" name="topic" defaultValue="other" className={SELECT_CLASS}>
              {FEEDBACK_TOPICS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            {err.topic && <p className="text-xs text-destructive">{err.topic}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fb-title">Гарчиг <span className="text-muted-foreground">(заавал биш)</span></Label>
            <Input id="fb-title" name="title" maxLength={150} placeholder="Товч гарчиг" />
            {err.title && <p className="text-xs text-destructive">{err.title}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fb-body">Таны санал</Label>
          <Textarea
            id="fb-body"
            name="body"
            rows={6}
            maxLength={4000}
            placeholder="Юуг сайжруулах, өөрчлөх, эсвэл юунд талархаж байгаагаа бичнэ үү…"
            aria-invalid={err.body ? true : undefined}
            className={cn(err.body && "border-destructive focus-visible:ring-destructive")}
          />
          {err.body && <p className="text-xs text-destructive">{err.body}</p>}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <input
            type="checkbox"
            name="anonymous"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span className="text-sm">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <EyeOff className="h-3.5 w-3.5" /> Нэрээ нууцлах
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Таны нэр, холбоо барих мэдээлэл огт хадгалагдахгүй. Энэ тохиолдолд
              хариуг танд хүргэх боломжгүй.
            </span>
          </span>
        </label>

        {!anonymous &&
          (signedInAs ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{signedInAs}</span> нэрээр илгээгдэнэ.
              Хариуг энэ хуудаснаас болон мэдэгдлээр авна.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fb-name">Нэр <span className="text-muted-foreground">(заавал биш)</span></Label>
                <Input id="fb-name" name="name" maxLength={120} />
                {err.name && <p className="text-xs text-destructive">{err.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fb-contact">И-мэйл эсвэл утас <span className="text-muted-foreground">(хариу авах бол)</span></Label>
                <Input id="fb-contact" name="contact" maxLength={200} />
                {err.contact && <p className="text-xs text-destructive">{err.contact}</p>}
              </div>
            </div>
          ))}

        {/* Honeypot: hidden from humans, filled by bots -> silently dropped server-side. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="fb-company">Компани</label>
          <input id="fb-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> Илгээж байна…
        </>
      ) : (
        <>
          <Send /> Илгээх
        </>
      )}
    </Button>
  );
}
