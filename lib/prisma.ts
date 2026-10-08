import { Prisma, PrismaClient } from "@prisma/client";

// Neon can drop a connection while it wakes up, and a static build renders
// many pages at once; one such hiccup used to fail the whole deploy. Reads
// that fail with a connection-level error are retried briefly. Writes are
// never retried — a write that actually landed would run twice.
const READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);
// Can't reach server, timeouts, server closed the connection, pool timeout.
const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);
const RETRY_DELAYS_MS = [300, 1000];

function isTransient(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  return err instanceof Prisma.PrismaClientKnownRequestError && TRANSIENT_CODES.has(err.code);
}

function createClient() {
  return new PrismaClient().$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        if (!READ_OPERATIONS.has(operation)) return query(args);
        for (let attempt = 0; ; attempt++) {
          try {
            return await query(args);
          } catch (err) {
            const delay = RETRY_DELAYS_MS[attempt];
            if (delay === undefined || !isTransient(err)) throw err;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
