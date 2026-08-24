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

const ICONS = [TrendingUp, GraduationCap, Medal, Award];

export function Quality({
  nationalExam,
  universityRate,
  olympiadMedals,
  pisaScore,
  nationalExamDesc,
  teacherDesc,
}: Props) {
  const kpis = [
    { label: "Улсын шалгалтын дундаж", value: nationalExam, suffix: "GPA" },
    { label: "Дээд сургуульд элссэн", value: universityRate, suffix: "%" },
    { label: "Олимпиадын медаль", value: olympiadMedals, suffix: "ш" },
    { label: "PISA дундаж", value: pisaScore, suffix: "оноо" },
  ];

  return (
    <SectionShell
      id="quality"
      tone="muted"
      eyebrow="Сургалтын чанар"
      title="Тоо баримт дээр тулгуурласан үнэлгээ"
      description="Улсын хэмжээний болон олон улсын үнэлгээний тайлангууд нээлттэй, шалгагдаж баталгаажсан эх сурвалжаас гаралтай."
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k, i) => {
          const Icon = ICONS[i]!;
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

      <div className="mt-6 grid gap-4 md:grid-cols-2">
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
      </div>
    </SectionShell>
  );
}
