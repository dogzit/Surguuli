export const APPROVER_POSITIONS = [
  "Сургалтын менежер",
  "Нийгмийн ажилтан",
  "Номын санч",
  "Нягтлан бодогч",
  "Нярав",
  "Эмч",
  "Захирал",
] as const;

export type ApproverPosition = (typeof APPROVER_POSITIONS)[number];

export const ACCOUNTANT_POSITION = "Нягтлан бодогч";

// Reviews the late-arrival report (/dashboard/admin/lateness).
export const SOCIAL_WORKER_POSITION = "Нийгмийн ажилтан";
