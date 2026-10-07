"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  EyeOff,
  Heart,
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  MessageSquareWarning,
  Send,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitFeedback, type FeedbackFormState } from "@/app/actions/feedback";
import { FEEDBACK_KINDS, FEEDBACK_TOPICS, type FeedbackKind } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const INITIAL_STATE: FeedbackFormState = { ok: false, message: "" };
const MIN_BODY = 10;
const MAX_BODY = 4000;

// Visual treatment per kind; labels and ids come from lib/feedback.ts.
const KIND_UI: Record<
  FeedbackKind,
  { icon: LucideIcon; hint: string; tone: string; placeholder: string }
> = {
  suggestion: {
    icon: Lightbulb,
    hint: "Сайжруулах санаа",
    tone: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    placeholder: "Жишээ нь: Номын санг бямба гарагт нээвэл олон сурагч ашиглах байсан…",
  },
  request: {
    icon: MessageSquarePlus,
    hint: "Шийдүүлэх асуудал",
    tone: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    placeholder: "Юуг, хэзээ гэхэд шийдвэрлүүлэхийг хүсэж байгаагаа бичнэ үү…",
  },
  complaint: {
    icon: MessageSquareWarning,
    hint: "Сэтгэл дундуур зүйл",
    tone: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
    placeholder: "Юу, хэзээ, хаана болсныг тодорхой бичвэл шийдвэрлэхэд хялбар болно…",
  },
  praise: {
    icon: Heart,
    hint: "Баярласан зүйл",
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    placeholder: "Хэнд, юунд талархаж байгаагаа бичнэ үү…",
  },
};

export function FeedbackForm({ signedInAs }: { signedInAs: string | null }) {
  const [state, formAction] = useFormState(submitFeedback, INITIAL_STATE);
  const [kind, setKind] = useState<FeedbackKind>("suggestion");
  const [topic, setTopic] = useState("other");
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sent, setSent] = useState(false);
  // Bumped per reset so the uncontrolled inputs (title, name, contact) clear.
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      setSent(true);
      // Pull the new row into "my feedback" for signed-in senders.
      router.refresh();
    } else if (!state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state, router]);

  const reset = () => {
    setKind("suggestion");
    setTopic("other");
    setBody("");
    setAnonymous(false);
    setFormKey((k) => k + 1);
    setSent(false);
  };

  if (sent) {
    return (
      <div className="px-6 py-14 text-center sm:px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5 dark:text-emerald-300">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">Баярлалаа!</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {state.message}
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={reset}>
            <Send /> Дахин санал илгээх
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/">Нүүр хуудас руу</Link>
          </Button>
        </div>
      </div>
    );
  }

  const err = state.fieldErrors ?? {};
  const remaining = MIN_BODY - body.trim().length;

  return (
    <form action={formAction} key={formKey} className="divide-y divide-border/60">
      <Step n={1} title="Юуны талаар бичих вэ?">
        <div className="grid grid-cols-2 gap-3">
          {FEEDBACK_KINDS.map((k) => {
            const ui = KIND_UI[k.id];
            const Icon = ui.icon;
            const active = kind === k.id;
            return (
              <label
                key={k.id}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition-all",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  active
                    ? "border-primary bg-primary/[0.06] shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/40",
                )}
              >
                <input
                  type="radio"
                  name="kind"
                  value={k.id}
                  checked={active}
                  onChange={() => setKind(k.id)}
                  className="sr-only"
                />
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", ui.tone)}>
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{k.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{ui.hint}</span>
                </span>
                {active && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </label>
            );
          })}
        </div>
        {err.kind && <p className="mt-2 text-xs text-destructive">{err.kind}</p>}
      </Step>

      <Step n={2} title="Сэдэв">
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_TOPICS.map((t) => (
            <label
              key={t.id}
              className={cn(
                "cursor-pointer rounded-full border px-3.5 py-2 text-sm transition-colors",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                topic === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name="topic"
                value={t.id}
                checked={topic === t.id}
                onChange={() => setTopic(t.id)}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
        {err.topic && <p className="mt-2 text-xs text-destructive">{err.topic}</p>}
      </Step>

      <Step n={3} title="Саналаа бичнэ үү">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="fb-title" className="text-xs text-muted-foreground">
              Гарчиг (заавал биш)
            </Label>
            <Input
              id="fb-title"
              name="title"
              maxLength={150}
              placeholder="Товч гарчиг"
              className="h-11 rounded-xl text-base sm:text-sm"
            />
            {err.title && <p className="text-xs text-destructive">{err.title}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fb-body" className="sr-only">Санал</Label>
            <Textarea
              id="fb-body"
              name="body"
              rows={6}
              maxLength={MAX_BODY}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={KIND_UI[kind].placeholder}
              aria-invalid={err.body ? true : undefined}
              className={cn(
                "rounded-xl px-3.5 py-3 text-base leading-relaxed sm:text-sm",
                err.body && "border-destructive focus-visible:ring-destructive",
              )}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={cn(err.body ? "text-destructive" : "text-muted-foreground")}>
                {err.body ?? (remaining > 0 ? `Дор хаяж ${remaining} тэмдэгт нэмнэ үү` : "Сайн байна ✓")}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {body.length}/{MAX_BODY}
              </span>
            </div>
          </div>
        </div>
      </Step>

      <div className="space-y-4 px-5 py-6 sm:px-8">
        <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-muted/30 p-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <EyeOff className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">Нэрээ нууцлах</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
              Нэр, холбоо барих мэдээлэл огт хадгалагдахгүй. Хариу хүргэх боломжгүй болно.
            </span>
          </span>
          <input
            type="checkbox"
            name="anonymous"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-6 w-11 shrink-0 rounded-full bg-muted-foreground/30 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-5"
          />
        </label>

        {!anonymous &&
          (signedInAs ? (
            <p className="rounded-xl bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">{signedInAs}</span> нэрээр илгээгдэнэ.
              Хариуг энэ хуудаснаас болон мэдэгдлээр авна.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fb-name" className="text-xs text-muted-foreground">Нэр (заавал биш)</Label>
                <Input id="fb-name" name="name" maxLength={120} className="h-11 rounded-xl text-base sm:text-sm" />
                {err.name && <p className="text-xs text-destructive">{err.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fb-contact" className="text-xs text-muted-foreground">
                  Утас эсвэл и-мэйл (хариу авах бол)
                </Label>
                <Input id="fb-contact" name="contact" maxLength={200} className="h-11 rounded-xl text-base sm:text-sm" />
                {err.contact && <p className="text-xs text-destructive">{err.contact}</p>}
              </div>
            </div>
          ))}

        {/* Honeypot: hidden from humans, filled by bots -> silently dropped server-side. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="fb-company">Компани</label>
          <input id="fb-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <SubmitButton disabled={remaining > 0} />
        <p className="text-center text-[11px] text-muted-foreground">
          Таны санал зөвхөн сургуулийн захиргаанд харагдана.
        </p>
      </div>
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="px-5 py-6 sm:px-8">
      <legend className="float-left mb-4 flex w-full items-center gap-2.5 text-sm font-semibold text-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {n}
        </span>
        {title}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending || disabled} className="h-12 w-full rounded-xl text-base">
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> Илгээж байна…
        </>
      ) : (
        <>
          <Send /> Санал илгээх
        </>
      )}
    </Button>
  );
}
