"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, EyeOff, Inbox, Loader2, Send, Trash2, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { deleteFeedback, updateFeedback } from "@/app/actions/feedback";
import { FEEDBACK_KINDS, FEEDBACK_STATUSES, FEEDBACK_TOPICS, optionLabel } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export interface FeedbackItem {
  id: string;
  kind: string;
  topic: string;
  title: string | null;
  body: string;
  anonymous: boolean;
  actorKind: string | null;
  name: string | null;
  contact: string | null;
  status: string;
  adminNote: string | null;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
}

type Filter = "open" | "new" | "in_review" | "resolved" | "archived" | "all";

const FILTERS: Array<{ id: Filter; label: string; match: (s: string) => boolean }> = [
  { id: "open", label: "Нээлттэй", match: (s) => s === "new" || s === "in_review" },
  ...FEEDBACK_STATUSES.map((s) => ({ id: s.id as Filter, label: s.label, match: (x: string) => x === s.id })),
  { id: "all", label: "Бүгд", match: () => true },
];

const STATUS_TONE: Record<string, string> = {
  new: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_review: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  resolved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  archived: "bg-muted text-muted-foreground",
};

const KIND_TONE: Record<string, string> = {
  suggestion: "text-violet-600 dark:text-violet-300",
  request: "text-sky-600 dark:text-sky-300",
  complaint: "text-rose-600 dark:text-rose-300",
  praise: "text-emerald-600 dark:text-emerald-300",
};

const ACTOR_LABEL: Record<string, string> = {
  student: "Сурагч",
  parent: "Эцэг эх",
  user: "Ажилтан",
};

const SELECT_CLASS =
  "h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function FeedbackInbox({ items }: { items: FeedbackItem[] }) {
  const [filter, setFilter] = useState<Filter>("open");
  const [kind, setKind] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)!;
    return items.filter((i) => f.match(i.status) && (kind === "all" || i.kind === kind));
  }, [items, filter, kind]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const n = items.filter((i) => f.match(i.status)).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === f.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label} <span className="ml-1 tabular-nums opacity-70">{n}</span>
            </button>
          );
        })}
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className={cn(SELECT_CLASS, "ml-auto")}
          aria-label="Төрлөөр шүүх"
        >
          <option value="all">Бүх төрөл</option>
          {FEEDBACK_KINDS.map((k) => (
            <option key={k.id} value={k.id}>{k.label}</option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Энэ ангилалд санал алга.</p>
          <p className="text-xs text-muted-foreground">
            Олон нийт <span className="font-mono">/feedback</span> хуудаснаас санал илгээнэ.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <FeedbackRow
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() => setOpenId((id) => (id === item.id ? null : item.id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FeedbackRow({
  item,
  open,
  onToggle,
}: {
  item: FeedbackItem;
  open: boolean;
  onToggle: () => void;
}) {
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.adminNote ?? "");
  const [response, setResponse] = useState(item.response ?? "");
  const [pending, start] = useTransition();
  const router = useRouter();

  const canReplyInApp = !item.anonymous && !!item.actorKind;

  const run = (input: Parameters<typeof updateFeedback>[1]) =>
    start(async () => {
      const res = await updateFeedback(item.id, input);
      if (res.ok) {
        toast.success(res.message ?? "Хадгалагдлаа");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  const remove = () => {
    if (!confirm("Энэ саналыг бүр мөсөн устгах уу?")) return;
    start(async () => {
      const res = await deleteFeedback(item.id);
      if (res.ok) {
        toast.success(res.message ?? "Устгагдлаа");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <li>
      <Card className={cn("overflow-hidden p-0", item.status === "new" && "border-sky-500/40")}>
        <button type="button" onClick={onToggle} className="flex w-full items-start gap-3 p-4 text-left">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className={cn("font-semibold", KIND_TONE[item.kind])}>
                {optionLabel(FEEDBACK_KINDS, item.kind)}
              </span>
              <span className="text-muted-foreground">· {optionLabel(FEEDBACK_TOPICS, item.topic)}</span>
              <span className="text-muted-foreground">
                · {new Date(item.createdAt).toLocaleString("mn-MN", { dateStyle: "medium", timeStyle: "short" })}
              </span>
              <span className={cn("rounded-full px-2 py-0.5 font-medium", STATUS_TONE[item.status])}>
                {optionLabel(FEEDBACK_STATUSES, item.status)}
              </span>
            </div>
            {item.title && <p className="mt-1.5 text-sm font-semibold text-foreground">{item.title}</p>}
            <p className={cn("mt-1 whitespace-pre-line text-sm text-muted-foreground", !open && "line-clamp-2")}>
              {item.body}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              {item.anonymous ? (
                <>
                  <EyeOff className="h-3 w-3" /> Нэргүй
                </>
              ) : (
                <>
                  <UserRound className="h-3 w-3" />
                  {item.name ?? "Нэр бичээгүй"}
                  {item.actorKind && ` · ${ACTOR_LABEL[item.actorKind] ?? item.actorKind}`}
                  {item.contact && ` · ${item.contact}`}
                </>
              )}
            </p>
          </div>
          <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="space-y-4 border-t border-border/60 bg-muted/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor={`st-${item.id}`} className="text-xs">Төлөв</Label>
              <select
                id={`st-${item.id}`}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={SELECT_CLASS}
              >
                {FEEDBACK_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`rs-${item.id}`} className="text-xs">Илгээгчид өгөх хариу</Label>
              <Textarea
                id={`rs-${item.id}`}
                rows={3}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder={canReplyInApp ? "Хариу бичих…" : "Хариуг хадгалж болно, гэхдээ илгээгчид автоматаар хүрэхгүй."}
              />
              <p className="text-[11px] text-muted-foreground">
                {canReplyInApp
                  ? "Илгээгч /feedback хуудсандаа хариуг харж, мэдэгдэл авна."
                  : item.contact
                    ? `Илгээгч нэвтрээгүй байсан тул ${item.contact} хаягаар шууд холбогдоно уу.`
                    : "Нэргүй эсвэл холбоо барих мэдээлэлгүй тул хариу хүргэх боломжгүй."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`nt-${item.id}`} className="text-xs">Дотоод тэмдэглэл (зөвхөн админд)</Label>
              <Textarea id={`nt-${item.id}`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                disabled={pending || !response.trim()}
                onClick={() => {
                  setStatus("resolved");
                  run({ status: "resolved", adminNote: note, response });
                }}
              >
                {pending ? <Loader2 className="animate-spin" /> : <Send />}
                Хариу илгээж шийдвэрлэх
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => run({ status, adminNote: note, response })}
              >
                Хадгалах
              </Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={remove} className="ml-auto text-destructive">
                <Trash2 /> Устгах
              </Button>
            </div>
          </div>
        )}
      </Card>
    </li>
  );
}
