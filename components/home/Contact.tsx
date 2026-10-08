import Link from "next/link";
import { ArrowRight, Clock, ExternalLink, EyeOff, Mail, MapPin, MessageSquareHeart, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionShell } from "./SectionShell";

interface Props {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  workHours: string;
  mapUrl: string;
}

const ICONS = [MapPin, Phone, Mail, Clock] as const;

export function Contact({ schoolName, address, phone, email, workHours, mapUrl }: Props) {
  const rows = [
    { icon: ICONS[0], label: "Хаяг", value: address },
    { icon: ICONS[1], label: "Утас", value: phone },
    { icon: ICONS[2], label: "И-мэйл", value: email },
    { icon: ICONS[3], label: "Ажлын цаг", value: workHours },
  ].filter((r) => r.value);

  return (
    <SectionShell
      id="contact"
      tone="muted"
      eyebrow="Холбоо барих"
      title="Бидэнтэй холбогдох"
      description="Албан бичиг, сурагчийн бүртгэл, эцэг эхийн хүсэлт болон бусад асуудлаар дараах хаягуудаар холбогдоно уу."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
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

          {(mapUrl || address) && (
            <a
              href={
                mapUrl ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  [schoolName, address].filter(Boolean).join(" "),
                )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Google Maps дээр байршлыг харах
            </a>
          )}

          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Санамж.</span> Албан
            ёсны бичгээр хандах бол бичиг баримтын дугаарыг заавал бичнэ үү. Бичиг
            хүлээн авсан 3 хоногийн дотор хариу өгнө.
          </div>
        </Card>

        {/* Feedback now lives on its own page (/feedback); this just points there. */}
        <Link
          href="/feedback"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-[linear-gradient(150deg,#0d4ea6_0%,#0a2f6b_60%,#071f4a_100%)] p-6 text-white shadow-lg shadow-[#0a2f6b]/20 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <span aria-hidden className="absolute -right-10 -top-10 h-36 w-36 rounded-full border-[5px] border-[#ffc928]/70" />
          <span aria-hidden className="absolute -bottom-12 right-16 h-28 w-28 rounded-full border-[5px] border-[#2fa84f]/70" />
          <div className="relative">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <MessageSquareHeart className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-xl font-bold tracking-tight">Санал хүсэлт илгээх</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/80">
              Санал, хүсэлт, гомдол, талархлаа тусгай хуудсаар хэдхэн минутад илгээнэ үү.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/70">
              <EyeOff className="h-3.5 w-3.5" /> Нэрээ нууцлах боломжтой
            </p>
          </div>
          <span className="relative mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0a2f6b] transition group-hover:gap-3">
            Санал хүсэлтийн хуудас <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </SectionShell>
  );
}
