import sanitizeHtml from "sanitize-html";

// Strict allowlist. Anything the RichEditor can produce is here;
// anything else is silently stripped. This runs on the server before
// persisting so a compromised client cannot inject <script>.
const ALLOWED_TAGS = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "hr",
];

// URL scheme allowlist for href/src. Blocks javascript:, data: (except
// images), file:, etc.
const SAFE_URL_RE = /^(https?:|mailto:|tel:|\/)/i;

const SAFE_IMG_URL_RE = /^(https?:|\/)/i;

/**
 * Sanitize rich-text HTML produced by the editor. Called from server
 * actions before `prisma.newsItem.update({ data: { body } })` etc.
 */
export function sanitizeRichHtml(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    // Any relative URL is fine — we still enforce the safety regex
    // below for extra defense.
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        if (!SAFE_URL_RE.test(href)) {
          // Drop unsafe href entirely — render as plain text.
          return { tagName: "span", attribs: {} };
        }
        return {
          tagName: "a",
          attribs: {
            ...attribs,
            // External links open in new tab with noopener to prevent
            // window.opener attacks.
            target: /^https?:/.test(href) ? "_blank" : attribs.target ?? "",
            rel: /^https?:/.test(href) ? "noopener noreferrer" : attribs.rel ?? "",
          },
        };
      },
      img: (tagName, attribs) => {
        const src = attribs.src ?? "";
        if (!SAFE_IMG_URL_RE.test(src)) {
          return { tagName: "span", attribs: {} };
        }
        return { tagName, attribs };
      },
    },
    disallowedTagsMode: "discard",
    // Text content is preserved even if wrapping tag is disallowed.
  });
}
