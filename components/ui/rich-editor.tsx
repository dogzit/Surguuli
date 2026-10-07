"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  className?: string;
  // Called after the user pastes an image URL through the toolbar.
  // If not provided, image button is hidden.
  onRequestImage?: () => Promise<string | null>;
}

export function RichEditor({
  value,
  onChange,
  placeholder = "Энд бичих…",
  disabled,
  minHeight = 160,
  className,
  onRequestImage,
}: Props) {
  const editor = useEditor({
    // Immediate render is fine on the client — we never render this in
    // SSR (parent components already client-only).
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Headings we allow — matches the sanitizer allowlist.
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable: !disabled,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none",
          "dark:prose-invert",
          "prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
          "prose-blockquote:border-l-primary/60 prose-blockquote:italic",
          "prose-img:rounded-lg prose-img:border prose-img:border-border/50",
        ),
      },
    },
  });

  // Sync incoming value changes (e.g. dialog re-opens with a different
  // item) without losing focus mid-typing.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className={cn("rounded-xl border border-border/50 bg-background", className)}
        style={{ minHeight }}
      />
    );
  }

  const btn = (active: boolean, disabled?: boolean) =>
    cn(
      "inline-flex h-8 w-8 items-center justify-center rounded-md border transition",
      active
        ? "border-primary/40 bg-primary/10 text-primary"
        : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
      disabled && "pointer-events-none opacity-40",
    );

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/50 bg-background", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/50 bg-muted/30 p-1.5">
        <button
          type="button"
          className={btn(editor.isActive("heading", { level: 1 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Гарчиг 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("heading", { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Гарчиг 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <button
          type="button"
          className={btn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("strike"))}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Зурсан"
        >
          <Underline className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <button
          type="button"
          className={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Жагсаалт"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Дугаартай жагсаалт"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("blockquote"))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Иш"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("codeBlock"))}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Код"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <button
          type="button"
          className={btn(editor.isActive("link"))}
          onClick={() => {
            const previous = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("URL", previous ?? "https://");
            if (url === null) return;
            if (url === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
            } else {
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }
          }}
          title="Холбоос"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        {onRequestImage && (
          <button
            type="button"
            className={btn(false)}
            onClick={async () => {
              const url = await onRequestImage();
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }}
            title="Зураг оруулах"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
        )}

        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            className={btn(false, !editor.can().undo())}
            onClick={() => editor.chain().focus().undo().run()}
            title="Буцаах"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={btn(false, !editor.can().redo())}
            onClick={() => editor.chain().focus().redo().run()}
            title="Дараагийнх"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
