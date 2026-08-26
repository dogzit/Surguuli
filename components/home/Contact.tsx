"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { ArrowRight, Clock, ExternalLink, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionShell } from "./SectionShell";
import {
  submitContactMessage,
  type ContactFormState,
} from "@/app/actions/contact";
import { cn } from "@/lib/utils";

interface Props {
  address: string;
  phone: string;
  email: string;
  workHours: string;
}

const ICONS = [MapPin, Phone, Mail, Clock] as const;
const INITIAL_STATE: ContactFormState = { ok: false, message: "" };

export function Contact({ address, phone, email, workHours }: Props) {
  const rows = [
    { icon: ICONS[0], label: "Хаяг", value: address },
    { icon: ICONS[1], label: "Утас", value: phone },
    { icon: ICONS[2], label: "И-мэйл", value: email },
    { icon: ICONS[3], label: "Ажлын цаг", value: workHours },
  ];

  const [state, formAction] = useFormState(submitContactMessage, INITIAL_STATE);

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) toast.success(state.message);
    else if (!state.fieldErrors) toast.error(state.message);
  }, [state]);

  return (
    <SectionShell
      id="contact"
      tone="muted"
      eyebrow="Холбоо барих"
      title="Бидэнтэй холбогдох"
      description="Албан бичиг, сурагчийн бүртгэл, эцэг эхийн хүсэлт болон бусад асуудлаар дараах хаягуудаар холбогдоно уу."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-foreground">Захиргааны хаяг</h3>
          <dl className="mt-4 space-y-3">
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-start gap-3">
                  <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd className="text-sm text-foreground">{row.value}</dd>
                  </div>
                </div>
              );
            })}
          </dl>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `Монгол улсын 3 дугаар сургууль ${address}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Google Maps дээр байршлыг харах
          </a>

          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Санамж.</span> Албан
            ёсны бичгээр хандах бол бичиг баримтын дугаарыг заавал бичнэ үү. Бичиг
            хүлээн авсан 3 хоногийн дотор хариу өгнө.
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-foreground">Санал хүсэлт илгээх</h3>
          <form
            action={formAction}
            key={state.ok ? "sent" : "editing"}
            className="mt-4 space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="contact-name"
                name="name"
                label="Овог, нэр"
                placeholder="Батбаяр Дорж"
                error={state.fieldErrors?.name}
              />
              <Field
                id="contact-email"
                name="email"
                type="email"
                label="И-мэйл"
                placeholder="you@example.com"
                error={state.fieldErrors?.email}
              />
            </div>
            <Field
              id="contact-subject"
              name="subject"
              label="Гарчиг"
              placeholder="Хүсэлтийн товч гарчиг"
              error={state.fieldErrors?.subject}
            />
            <div className="space-y-1.5">
              <Label htmlFor="contact-body">Санал / хүсэлт</Label>
              <Textarea
                id="contact-body"
                name="body"
                rows={5}
                placeholder="Хүсэлтийн дэлгэрэнгүй агуулга…"
                aria-invalid={state.fieldErrors?.body ? true : undefined}
                className={cn(
                  state.fieldErrors?.body &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {state.fieldErrors?.body && (
                <p className="text-xs text-destructive">{state.fieldErrors.body}</p>
              )}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Бүх талбар нууцлагдана
              </span>
              <SubmitButton />
            </div>
          </form>
        </Card>
      </div>
    </SectionShell>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  placeholder,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          Илгээж байна…
        </>
      ) : (
        <>
          Илгээх
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </>
      )}
    </Button>
  );
}
