"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, UserPlus, FileSignature } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AdminSignature } from "./SignaturesPanel";

interface ActivityItem {
  id: string;
  type: "signature" | "user_created" | "bulk_reset";
  description: string;
  detail: string;
  timestamp: string;
  icon: typeof CheckCircle2;
  tone: "success" | "info" | "warning";
}

const toneStyles = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  info: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

function buildActivity(signatures: AdminSignature[]): ActivityItem[] {
  const items: ActivityItem[] = signatures.slice(0, 8).map((s) => ({
    id: s.id,
    type: "signature",
    description: `${s.approver.name} → ${s.teacher.name}`,
    detail: s.note ? `"${s.note}"` : "Гарын үсэг зурсан",
    timestamp: s.createdAt,
    icon: CheckCircle2,
    tone: "success" as const,
  }));

  return items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

function fmt(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Яг одоо";
  if (diffMin < 60) return `${diffMin} минутын өмнө`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} цагийн өмнө`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} хоногийн өмнө`;
}

export default function RecentActivity({
  signatures,
}: {
  signatures: AdminSignature[];
}) {
  const activities = buildActivity(signatures);

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Сүүлийн үйл ажиллагаа
        </h2>
        <span className="text-xs text-muted-foreground">
          {activities.length} бичлэг
        </span>
      </div>
      <div className="space-y-2">
        {activities.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/30">
                <div
                  className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${toneStyles[item.tone]}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {item.description}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {item.detail}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-[11px] tabular-nums text-muted-foreground">
                    {fmt(item.timestamp)}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
        {activities.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Одоогоор үйл ажиллагаа байхгүй
          </Card>
        )}
      </div>
    </div>
  );
}
