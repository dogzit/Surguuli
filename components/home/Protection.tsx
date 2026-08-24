import Link from "next/link";
import { CheckCircle2, Phone, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionShell } from "./SectionShell";

interface Props {
  policies: string[];
  officer: string;
  phone: string;
  email: string;
}

export function Protection({ policies, officer, phone, email }: Props) {
  return (
    <SectionShell
      id="protection"
      tone="light"
      eyebrow="Хүүхэд хамгаалал"
      title="Аюулгүй, хүндэтгэлтэй сургуулийн орчин"
      description="Хүүхдийн эрх, аюулгүй байдлыг хамгаалах бодлого, эрсдэлийн үнэлгээ, албан ёсны хариуцлагатай ажилтны нэр, харилцах утас нь энэ хэсэгт нээлттэй байршдаг."
    >
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <ul className="space-y-3">
          {policies.map((p) => (
            <li key={p}>
              <Card className="flex items-start gap-3 p-4">
                <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-foreground">{p}</span>
              </Card>
            </li>
          ))}
        </ul>

        <Card className="border-primary/30 bg-primary/[0.04] p-6">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <ShieldAlert className="h-3.5 w-3.5" />
            Яаралтай тохиолдолд
          </div>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            Хүүхэд хамгааллын нэгж
          </h3>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Хариуцсан</dt>
              <dd className="font-medium text-foreground">{officer}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Утас</dt>
              <dd className="flex items-center gap-1 font-mono text-foreground">
                <Phone className="h-3 w-3" />
                {phone}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">И-мэйл</dt>
              <dd className="font-mono text-xs text-foreground">{email}</dd>
            </div>
          </dl>
          <Button asChild className="mt-5 w-full">
            <Link href="/contact">Албан ёсны хүсэлт илгээх</Link>
          </Button>
        </Card>
      </div>
    </SectionShell>
  );
}
