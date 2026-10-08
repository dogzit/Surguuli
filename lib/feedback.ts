// Shared, client-safe option lists for the feedback box. Server actions
// validate against these ids; the UI renders the labels.

export const FEEDBACK_KINDS = [
  { id: "suggestion", label: "Санал" },
  { id: "request", label: "Хүсэлт" },
  { id: "complaint", label: "Гомдол" },
  { id: "praise", label: "Талархал" },
] as const;

export const FEEDBACK_TOPICS = [
  { id: "teaching", label: "Сургалт, хичээл" },
  { id: "environment", label: "Сургуулийн орчин" },
  { id: "safety", label: "Аюулгүй байдал" },
  { id: "food", label: "Хоол, цайны газар" },
  { id: "activities", label: "Дугуйлан, арга хэмжээ" },
  { id: "website", label: "Цахим хуудас" },
  { id: "other", label: "Бусад" },
] as const;

export const FEEDBACK_STATUSES = [
  { id: "new", label: "Шинэ" },
  { id: "in_review", label: "Хянаж байна" },
  { id: "resolved", label: "Шийдвэрлэсэн" },
  { id: "archived", label: "Архивласан" },
] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]["id"];
export type FeedbackTopic = (typeof FEEDBACK_TOPICS)[number]["id"];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]["id"];

type Option = { readonly id: string; readonly label: string };

export function optionLabel(list: readonly Option[], id: string): string {
  return list.find((o) => o.id === id)?.label ?? id;
}

export function isOption(list: readonly Option[], id: string): boolean {
  return list.some((o) => o.id === id);
}
