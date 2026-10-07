// Kept under app/ (not lib/) so Tailwind's content scan picks up the classes.

/** Badge colours for a minutes-late value: 30+ red, 15+ amber. */
export function minutesTone(m: number): string {
  if (m >= 30) return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
  if (m >= 15) return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "bg-muted text-muted-foreground";
}
