"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveSchoolInfo, type SchoolInfoInput } from "@/app/actions/school-info";

// Must stay in sync with the ICONS map in components/home/About.tsx —
// any other name falls back to the default icon there.
const ICON_OPTIONS = [
  "Landmark",
  "GraduationCap",
  "BookOpen",
  "Building2",
  "MapPin",
  "Clock",
  "Users",
  "Award",
];

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type TextKey = Exclude<
  keyof SchoolInfoInput,
  "protectionPolicies" | "gradeManagers" | "history" | "mission" | "locations"
>;

export function SchoolInfoForm({ initial }: { initial: SchoolInfoInput }) {
  const [form, setForm] = useState<SchoolInfoInput>(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  const set = <K extends keyof SchoolInfoInput>(key: K, value: SchoolInfoInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const text = (key: TextKey, label: string, opts?: { placeholder?: string; long?: boolean; hint?: string }) => (
    <div className="space-y-1.5">
      <Label htmlFor={`si-${key}`} className="text-xs">{label}</Label>
      {opts?.long ? (
        <Textarea
          id={`si-${key}`}
          rows={3}
          value={form[key]}
          placeholder={opts.placeholder}
          onChange={(e) => set(key, e.target.value)}
        />
      ) : (
        <Input
          id={`si-${key}`}
          value={form[key]}
          placeholder={opts?.placeholder}
          onChange={(e) => set(key, e.target.value)}
        />
      )}
      {opts?.hint && <p className="text-[11px] text-muted-foreground">{opts.hint}</p>}
    </div>
  );

  const save = () => {
    start(async () => {
      const res = await saveSchoolInfo(form);
      if (res.ok) {
        toast.success(res.message ?? "Хадгалагдлаа");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-5 pb-24">
      <Section title="Ерөнхий" description="Сайтын гарчиг, хөл хэсэг, хайлтын системд харагдана.">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("name", "Сургуулийн бүтэн нэр")}
          {text("shortName", "Товч нэр")}
          {text("foundedYear", "Байгуулагдсан он", { placeholder: "1921" })}
          {text("developerCredit", "Хөгжүүлэгч (хөл хэсэгт)")}
        </div>
      </Section>

      <Section title="Холбоо барих">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("address", "Хаяг")}
          {text("district", "Дүүрэг")}
          {text("city", "Хот")}
          {text("phone", "Утас")}
          {text("email", "И-мэйл")}
          {text("workHours", "Ажлын цаг", { placeholder: "Дав—Баа · 08:00 — 17:00" })}
          {text("mapUrl", "Google Maps холбоос", {
            placeholder: "https://maps.app.goo.gl/...",
            hint: "Google Maps → Share → Copy link. Хоосон бол хаягаар хайлт хийнэ.",
          })}
        </div>
      </Section>

      <Section title="Захирал" description="Нүүр хуудасны мэндчилгээ хэсэгт харагдана.">
        <div className="grid gap-4">
          {text("principalName", "Захирлын нэр")}
          {text("principalQuote", "Мэндчилгээ / ишлэл", { long: true })}
        </div>
      </Section>

      <Section
        title="Тоон үзүүлэлт"
        description="Зөвхөн баталгаатай тоо оруулна уу. Хоосон үлдээсэн үзүүлэлт сайт дээр харагдахгүй."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {text("heroStudents", "Сурагчийн тоо")}
          {text("heroStaff", "Багш, ажилтны тоо")}
          {text("olympiadMedals", "Олимпиадын медаль")}
          {text("qualityNationalExam", "Улсын шалгалтын дундаж (GPA)")}
          {text("qualityUniversityRate", "Дээд сургуульд элсэлт (%)")}
          {text("qualityPisaScore", "PISA дундаж оноо")}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {text("qualityNationalExamDesc", "Ерөнхий шалгалтын тайлбар", { long: true })}
          {text("qualityTeacherDesc", "Багшийн чанарын тайлбар", { long: true })}
        </div>
      </Section>

      <Section title="Хүүхэд хамгаалал">
        <div className="grid gap-4 sm:grid-cols-3">
          {text("protectionOfficer", "Хариуцсан ажилтан")}
          {text("protectionPhone", "Утас")}
          {text("protectionEmail", "И-мэйл")}
        </div>
        <div className="mt-4">
          <Label className="text-xs">Бодлого, журам</Label>
          <RowList
            items={form.protectionPolicies}
            onChange={(v) => set("protectionPolicies", v)}
            blank={() => ""}
            addLabel="Бодлого нэмэх"
            render={(item, update) => (
              <Input value={item} onChange={(e) => update(e.target.value)} />
            )}
          />
        </div>
      </Section>

      <Section title="Ангийн менежер" description="Анги бүлэг хуудсанд анги тус бүрийн дээр харагдана.">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
            <div key={g} className="space-y-1">
              <Label htmlFor={`si-gm-${g}`} className="text-xs">{g}-р анги</Label>
              <Input
                id={`si-gm-${g}`}
                value={form.gradeManagers[g] ?? ""}
                onChange={(e) =>
                  set("gradeManagers", { ...form.gradeManagers, [g]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Түүхэн замнал" description="Танилцуулга хуудасны цагийн хэлхээс.">
        <RowList
          items={form.history}
          onChange={(v) => set("history", v)}
          blank={() => ({ year: "", title: "", body: "", icon: "Landmark" })}
          addLabel="Үе шат нэмэх"
          render={(item, update) => (
            <div className="grid gap-2 sm:grid-cols-[110px_1fr_140px]">
              <Input placeholder="Он" value={item.year} onChange={(e) => update({ ...item, year: e.target.value })} />
              <Input placeholder="Гарчиг" value={item.title} onChange={(e) => update({ ...item, title: e.target.value })} />
              <IconSelect value={item.icon ?? ""} onChange={(icon) => update({ ...item, icon })} />
              <Textarea
                className="sm:col-span-3"
                rows={2}
                placeholder="Тайлбар"
                value={item.body}
                onChange={(e) => update({ ...item, body: e.target.value })}
              />
            </div>
          )}
        />
      </Section>

      <Section title="Эрхэм зорилго">
        <RowList
          items={form.mission}
          onChange={(v) => set("mission", v)}
          blank={() => ({ icon: "BookOpen", title: "", body: "" })}
          addLabel="Зорилго нэмэх"
          render={(item, update) => (
            <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
              <Input placeholder="Гарчиг" value={item.title} onChange={(e) => update({ ...item, title: e.target.value })} />
              <IconSelect value={item.icon} onChange={(icon) => update({ ...item, icon })} />
              <Textarea
                className="sm:col-span-2"
                rows={2}
                placeholder="Тайлбар"
                value={item.body}
                onChange={(e) => update({ ...item, body: e.target.value })}
              />
            </div>
          )}
        />
      </Section>

      <Section title="Байршлын түүх">
        <RowList
          items={form.locations}
          onChange={(v) => set("locations", v)}
          blank={() => ({ num: String(form.locations.length + 1).padStart(2, "0"), label: "", era: "" })}
          addLabel="Байршил нэмэх"
          render={(item, update) => (
            <div className="grid gap-2 sm:grid-cols-[70px_1fr_1fr]">
              <Input placeholder="01" value={item.num} onChange={(e) => update({ ...item, num: e.target.value })} />
              <Input placeholder="Байршил" value={item.label} onChange={(e) => update({ ...item, label: e.target.value })} />
              <Input placeholder="Үе (жишээ нь Анхны байршил)" value={item.era} onChange={(e) => update({ ...item, era: e.target.value })} />
            </div>
          )}
        />
      </Section>

      <div className="fixed bottom-4 right-4 z-20 sm:bottom-6 sm:right-8">
        <Button size="lg" onClick={save} disabled={pending} className="shadow-lg">
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Хадгалах
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className={SELECT_CLASS} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Дүрс тэмдэг">
      {ICON_OPTIONS.map((name) => (
        <option key={name} value={name}>{name}</option>
      ))}
    </select>
  );
}

function RowList<T>({
  items,
  onChange,
  blank,
  addLabel,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: () => T;
  addLabel: string;
  render: (item: T, update: (next: T) => void) => ReactNode;
}) {
  return (
    <div className="mt-2 space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-border/60 p-3">
          <div className="min-w-0 flex-1">
            {render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Устгах"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <Trash2 className="text-muted-foreground" />
          </Button>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">Одоогоор хоосон. Хоосон бол сайт дээр энэ хэсэг харагдахгүй.</p>
      )}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, blank()])}>
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}
