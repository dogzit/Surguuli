export const APPROVER_POSITIONS = [
  "Сургалтын менежер",
  "Нийгмийн ажилтан",
  "Номын санч 1",
  "Номын санч 2",
  "Нягтлан бодогч",
  "Няраав",
  "Эмч",
  "Ээлжийн багш",
  "Захирал",
] as const;

export type ApproverPosition = (typeof APPROVER_POSITIONS)[number];
