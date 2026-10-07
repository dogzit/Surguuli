import { prisma } from "./prisma";
import { getCurrentActor, type Actor } from "./session";
import { getClientIp } from "./rate-limit";

export interface AuditInput {
  /** Dotted-namespace verb, e.g. "user.delete", "signature.clear_all". */
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: unknown;
}

/**
 * Write an audit-log row. Never throws — if the DB is unreachable we log to
 * stderr rather than blocking the mutation the caller is completing.
 *
 * The actor is the signed-in student or parent; staff actions are logged
 * by the staff site.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    const [actor, ip] = await Promise.all([
      getCurrentActor().catch(() => null),
      getClientIp().catch(() => "unknown"),
    ]);
    const who = describe(actor);

    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: who.id,
        actorName: who.name,
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

function describe(actor: Actor | null): { id: string | null; name: string } {
  switch (actor?.kind) {
    case "student":
      return { id: actor.student.id, name: `${actor.student.lastName}. ${actor.student.firstName}` };
    case "parent":
      return { id: actor.parent.id, name: actor.parent.name };
    default:
      return { id: null, name: "Зочин" };
  }
}
