// The eight document types a school typically issues for a Common App /
// abroad-university application. `type` on DocumentRequest is validated
// against this list — do NOT rename slugs after production rows exist.

export interface DocumentTypeDef {
  slug: string;
  label: string; // Mongolian
  english: string; // for admin reference
  category: "academic" | "letter" | "administrative";
  description: string;
}

export const DOCUMENT_TYPES: readonly DocumentTypeDef[] = [
  {
    slug: "transcript",
    label: "Албан ёсны дүнгийн хуулга",
    english: "Official Transcript",
    category: "academic",
    description: "9—12 анги хүртэлх бүх хичээл, крэдит, дүн.",
  },
  {
    slug: "school_profile",
    label: "Сургуулийн танилцуулга",
    english: "School Profile",
    category: "academic",
    description: "Сургалтын систем, дүнгийн масштаб, статистик.",
  },
  {
    slug: "mid_year_report",
    label: "Жилийн дунд үеийн тайлан",
    english: "Mid-Year Report",
    category: "academic",
    description: "12-р ангийн 1-р семестрийн шинэчилсэн дүн.",
  },
  {
    slug: "final_report",
    label: "Эцсийн тайлан",
    english: "Final Report",
    category: "academic",
    description: "12-р ангийг амжилттай төгссөнийг баталгаажуулна.",
  },
  {
    slug: "counselor_rec",
    label: "Сургуулийн зөвлөхийн тодорхойлолт",
    english: "Counselor Recommendation / School Report",
    category: "letter",
    description: "Зөвлөх/сургалтын менежерийн бичсэн тодорхойлолт.",
  },
  {
    slug: "teacher_rec",
    label: "Багшийн тодорхойлолт захидал",
    english: "Teacher Recommendation",
    category: "letter",
    description: "11—12 ангийн үндсэн хичээлийн багшаас 1—2 тодорхойлолт.",
  },
  {
    slug: "fee_waiver",
    label: "Хураамжаас чөлөөлөх хүсэлт",
    english: "Fee Waiver Verification",
    category: "administrative",
    description: "Санхүүгийн боломж баталгаажсан бичиг.",
  },
  {
    slug: "class_rank",
    label: "Эрэмбэ / дүнгийн системийн мэдэгдэл",
    english: "Class Rank / Grading Scale Statement",
    category: "administrative",
    description: "GPA-г жигнэдэг эсэх, эрэмбэ гаргадаг эсэх тайлбар.",
  },
] as const;

export const DOCUMENT_TYPE_BY_SLUG: Record<string, DocumentTypeDef> = Object.fromEntries(
  DOCUMENT_TYPES.map((d) => [d.slug, d]),
);

export const VALID_DOCUMENT_SLUGS = new Set(DOCUMENT_TYPES.map((d) => d.slug));

export const DOCUMENT_STATUSES = ["pending", "in_progress", "ready", "delivered"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  pending: "Хүлээгдэж буй",
  in_progress: "Бэлтгэж байна",
  ready: "Бэлэн",
  delivered: "Хүргэгдсэн",
};

export const APPLICATION_STATUSES = ["open", "submitted", "complete", "cancelled"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  open: "Идэвхтэй",
  submitted: "Илгээгдсэн",
  complete: "Хүлээн зөвшөөрөгдсөн",
  cancelled: "Цуцлагдсан",
};

export const CATEGORY_LABEL: Record<DocumentTypeDef["category"], string> = {
  academic: "Сургалтын бүртгэл",
  letter: "Тодорхойлолт, захидал",
  administrative: "Захиргааны баталгаажуулалт",
};
