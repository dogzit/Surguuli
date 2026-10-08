// Thin wrapper over Resend's REST API. No SDK dependency — one fetch
// call. If RESEND_API_KEY is not set (dev, first-week production) we
// log to stderr and return `{ sent: false, skipped: true }` so
// callers don't have to branch.
//
// Wire this from lib/notifications.ts by calling `sendMail` alongside
// `notifyActor` when the recipient has an email address on file.

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  // Optional reply-to for reply-back use cases.
  replyTo?: string;
}

export interface MailResult {
  sent: boolean;
  skipped?: boolean;
  id?: string;
  error?: string;
}

function defaultFrom(): string {
  // FROM has to be a domain you verified in Resend. Falls back to
  // Resend's shared onboarding domain so local dev works out of the
  // box; SWAP TO YOUR OWN DOMAIN before launch (deliverability).
  return process.env.MAIL_FROM ?? "Surguuli <onboarding@resend.dev>";
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Dev fallback: pretend we sent. Log so the developer sees it
    // happening without noise on every request.
    console.info(`[mail] skipped (no RESEND_API_KEY) to=${input.to} subject="${input.subject}"`);
    return { sent: false, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: defaultFrom(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { id?: string; message?: string }
      | null;
    if (!res.ok) {
      const msg = json?.message ?? `HTTP ${res.status}`;
      console.error(`[mail] send failed: ${msg}`);
      return { sent: false, error: msg };
    }
    return { sent: true, id: json?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error(`[mail] send exception: ${msg}`);
    return { sent: false, error: msg };
  }
}

// ── Tiny HTML template helpers ────────────────────────────────

/**
 * Minimal transactional HTML shell. Keep the markup boring so it
 * renders identically in Gmail, Outlook, and Apple Mail without
 * MSO conditionals.
 */
export function renderEmailShell({
  title,
  intro,
  ctaLabel,
  ctaHref,
  footer,
}: {
  title: string;
  intro: string;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: string;
}): { html: string; text: string } {
  const safe = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111827">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
        <tr><td>
          <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#111827">${safe(title)}</h1>
          <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#374151">${safe(intro)}</p>
          ${
            ctaLabel && ctaHref
              ? `<p style="margin:0 0 20px 0"><a href="${safe(ctaHref)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:10px;font-weight:600;font-size:14px">${safe(ctaLabel)}</a></p>`
              : ""
          }
          ${footer ? `<p style="margin:24px 0 0 0;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">${safe(footer)}</p>` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const text = [title, "", intro, ctaLabel && ctaHref ? `${ctaLabel}: ${ctaHref}` : "", footer]
    .filter(Boolean)
    .join("\n\n");
  return { html, text };
}
