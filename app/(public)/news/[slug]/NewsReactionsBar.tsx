"use client";

import { useState, useTransition } from "react";
import { Bookmark, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleBookmark, toggleReaction } from "@/app/actions/community";

interface Props {
  newsItemId: string;
  initialHearts: number;
  initialClaps: number;
  // These three tell us whether the current viewer has already
  // heart'd / clapped / bookmarked, so the button state is right on
  // first render (no flash of "unbookmarked" state).
  myHeart: boolean;
  myClap: boolean;
  myBookmark: boolean;
  // Null = not logged in. Reaction/bookmark buttons redirect to login.
  isLoggedIn: boolean;
}

export function NewsReactionsBar({
  newsItemId,
  initialHearts,
  initialClaps,
  myHeart,
  myClap,
  myBookmark,
  isLoggedIn,
}: Props) {
  // Optimistic state — flip immediately, roll back on error.
  const [hearts, setHearts] = useState(initialHearts);
  const [claps, setClaps] = useState(initialClaps);
  const [hearted, setHearted] = useState(myHeart);
  const [clapped, setClapped] = useState(myClap);
  const [bookmarked, setBookmarked] = useState(myBookmark);
  const [pending, start] = useTransition();

  const ensureLoggedIn = () => {
    if (isLoggedIn) return true;
    toast.info("Нэвтэрч орсны дараа ашиглана уу.", {
      action: {
        label: "Нэвтрэх",
        onClick: () => {
          window.location.href = "/login";
        },
      },
    });
    return false;
  };

  const flipReaction = (kind: "heart" | "clap") => {
    if (!ensureLoggedIn()) return;
    const wasActive = kind === "heart" ? hearted : clapped;
    // Optimistic
    if (kind === "heart") {
      setHearted(!wasActive);
      setHearts((c) => c + (wasActive ? -1 : 1));
    } else {
      setClapped(!wasActive);
      setClaps((c) => c + (wasActive ? -1 : 1));
    }
    start(async () => {
      const res = await toggleReaction(newsItemId, kind);
      if (!res.ok) {
        // Roll back
        if (kind === "heart") {
          setHearted(wasActive);
          setHearts((c) => c + (wasActive ? 1 : -1));
        } else {
          setClapped(wasActive);
          setClaps((c) => c + (wasActive ? 1 : -1));
        }
        toast.error(res.error);
      }
    });
  };

  const flipBookmark = () => {
    if (!ensureLoggedIn()) return;
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);
    start(async () => {
      const res = await toggleBookmark("news", newsItemId);
      if (!res.ok) {
        setBookmarked(wasBookmarked);
        toast.error(res.error);
      } else if (res.data) {
        toast.success(res.data.bookmarked ? "Хадгаллаа" : "Хадгалалт цуцлагдлаа");
      }
    });
  };

  return (
    <div className="my-8 flex items-center justify-between gap-3 border-y border-border/50 py-4">
      <div className="flex items-center gap-2">
        <ReactionButton
          active={hearted}
          count={hearts}
          disabled={pending}
          onClick={() => flipReaction("heart")}
          activeClass="border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
          Icon={Heart}
          label="Таалагдсан"
        />
        <ReactionButton
          active={clapped}
          count={claps}
          disabled={pending}
          onClick={() => flipReaction("clap")}
          activeClass="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          Icon={Sparkles}
          label="Магтав"
        />
      </div>
      <button
        type="button"
        onClick={flipBookmark}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition",
          bookmarked
            ? "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400"
            : "border-border/60 bg-background text-muted-foreground hover:text-foreground",
        )}
      >
        <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
        {bookmarked ? "Хадгалсан" : "Хадгалах"}
      </button>
    </div>
  );
}

function ReactionButton({
  active,
  count,
  disabled,
  onClick,
  activeClass,
  Icon,
  label,
}: {
  active: boolean;
  count: number;
  disabled: boolean;
  onClick: () => void;
  activeClass: string;
  Icon: typeof Heart;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium tabular-nums transition",
        active
          ? activeClass
          : "border-border/60 bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4", active && "fill-current")} />
      {count}
    </button>
  );
}
