import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionShell } from "./SectionShell";

interface Props {
  address: string;
  phone: string;
  email: string;
  workHours: string;
}

const ICONS = [MapPin, Phone, Mail, Clock] as const;

export function Contact({ address, phone, email, workHours }: Props) {
  const rows = [
    { icon: ICONS[0], label: "Хаяг", value: address },
    { icon: ICONS[1], label: "Утас", value: phone },
    { icon: ICONS[2], label: "И-мэйл", value: email },
    { icon: ICONS[3], label: "Ажлын цаг", value: workHours },
  ];

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

          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Санамж.</span> Албан
            ёсны бичгээр хандах бол бичиг баримтын дугаарыг заавал бичнэ үү. Бичиг
            хүлээн авсан 3 хоногийн дотор хариу өгнө.
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-foreground">Санал хүсэлт илгээх</h3>
          <form className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">Овог, нэр</Label>
                <Input id="contact-name" placeholder="Батбаяр Дорж" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">И-мэйл</Label>
                <Input id="contact-email" type="email" placeholder="you@example.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-subject">Гарчиг</Label>
              <Input id="contact-subject" placeholder="Хүсэлтийн товч гарчиг" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-body">Санал / хүсэлт</Label>
              <Textarea
                id="contact-body"
                rows={5}
                placeholder="Хүсэлтийн дэлгэрэнгүй агуулга…"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Бүх талбар нууцлагдана
              </span>
              <Button type="button">
                Илгээх
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </SectionShell>
  );
}
