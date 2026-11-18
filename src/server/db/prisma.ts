import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function resolveDevDatabaseUrl(): string | undefined {
  if (process.env.NODE_ENV === "production") {
    return process.env.DATABASE_URL;
  }

  try {
    const localEnvPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(localEnvPath)) {
      const content = fs.readFileSync(localEnvPath, "utf8");
      const match = content.match(/^DATABASE_URL=(?:"([^"]+)"|'([^']+)'|(.+))$/m);
      const localUrl = (match?.[1] ?? match?.[2] ?? match?.[3])?.trim();
      if (localUrl) {
        process.env.DATABASE_URL = localUrl;
        return localUrl;
      }
    }
  } catch {
    // Fall back to process.env.DATABASE_URL
  }

  return process.env.DATABASE_URL;
}

declare global {
  var prisma: PrismaClient | undefined;
}

const datasourceUrl = resolveDevDatabaseUrl();

export const db =
  global.prisma ??
  new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}