import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CYR_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "ye", ё: "yo",
  ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m",
  н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t",
  у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function toLatin(s: string): string {
  return s
    .toLowerCase()
    .split("")
    .map((c) => CYR_TO_LAT[c] ?? c)
    .join("");
}

export function matchesSearch(haystack: string, needle: string): boolean {
  const raw = needle.trim().toLowerCase();
  if (!raw) return true;
  const text = haystack.toLowerCase();
  if (text.includes(raw)) return true;
  return toLatin(text).includes(toLatin(raw));
}
