import { Award, GraduationCap, Medal, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionShell } from "./SectionShell";

interface Props {
  nationalExam: string;
  universityRate: string;
  olympiadMedals: string;
  pisaScore: string;
  nationalExamDesc: string;
  teacherDesc: string;
}

const ICONS = [TrendingUp, GraduationCap, Medal, Award] as const;

export function Quality({
  nationalExam,
  universityRate,
  olympiadMedals,
  pisaScore,
  nationalExamDesc,
  teacherDesc,
}: Props) {
  // Only show numbers the school actually entered in the admin panel.
  const kpis = [
    { label: "Улсын шалгалтын дундаж", value: nationalExam, suffix: "GPA", icon: ICONS[0] },
    { label: "Дээд сургуульд элссэн", value: universityRate, suffix: "%", icon: ICONS[1] },
    { label: "Олимпиадын медаль", value: olympiadMedals, suffix: "ш", icon: ICONS[2] },
    { label: "PISA дундаж", value: pisaScore, suffix: "оноо", icon: ICONS[3] },
  ].filter((k) => k.value);
  const isEmpty = kpis.length === 0 && !nationalExamDesc && !teacherDesc;

  return (
    <SectionShell
      id="quality"
      tone="muted"
      eyebrow="Сургалтын чанар"
      title="Тоо баримт дээр тулгуурласан үнэлгээ"
      description="Улсын хэмжээний болон олон улсын үнэлгээний тайлангууд нээлттэй, шалгагдаж баталгаажсан эх сурвалжаас гаралтай."
    >
      {isEmpty && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
          Сургалтын чанарын үзүүлэлт удахгүй нийтлэгдэнэ.
        </div>
      )}
      {kpis.length > 0 && (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="flex items-center gap-3 p-4">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {k.label}
                </div>
                <div className="flex items-baseline gap-1 text-foreground">
                  <span className="text-2xl font-bold tabular-nums">{k.value}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {k.suffix}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {nationalExamDesc && (
        <Card className="p-6">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Улсын хэмжээний үнэлгээ
          </div>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            Ерөнхий шалгалтын үр дүн
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {nationalExamDesc}
          </p>
        </Card>
        )}
        {teacherDesc && (
        <Card className="p-6">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Багшийн чанар
          </div>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            Мэргэшсэн боловсон хүчин
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {teacherDesc}
          </p>
        </Card>
        )}
      </div>
    </SectionShell>
  );
}
