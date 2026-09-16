import { prisma } from "./prisma";
import { getCurrentUser } from "./session";
import { getClientIp } from "./rate-limit";

export interface AuditInput {
  /** Dotted-namespace verb, e.g. "user.delete", "signature.clear_all". */
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: unknown;
}

/**
 * Write an audit-log row. Never throws — if the DB is unreachable (or the
 * AuditLog table doesn't exist yet because migrations haven't been pushed)
 * we log to stderr rather than blocking the mutation the caller is
 * completing.
 *
 * The actor is derived from the current request context: prefer the signed-in
 * user (approver session) and fall back to the "admin" label when only the
 * admin PIN cookie is present.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    const [user, ip] = await Promise.all([
      getCurrentUser().catch(() => null),
      getClientIp().catch(() => "unknown"),
    ]);

    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: user?.id ?? null,
        actorName: user?.name ?? "admin",
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        metadata:
          input.metadata !== undefined
            ? JSON.stringify(input.metadata).slice(0, 4000)
            : null,
        ip,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write log", err);
  }
}
