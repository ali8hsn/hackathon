import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// reason: Prisma 7 + SQLite requires the better-sqlite3 adapter with config
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function resolveDbFileUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!raw.startsWith("file:")) return raw;
  const filePath = raw.slice("file:".length);
  if (path.isAbsolute(filePath)) return raw;
  const abs = path.resolve(process.cwd(), filePath);
  return `file:${abs}`;
}

function createPrisma(): PrismaClient {
  const url = resolveDbFileUrl();
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({
    // reason: Prisma 7 adapter type doesn't match older PrismaClient overloads yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter: adapter as any,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
