import { randomBytes } from "node:crypto";
import { z } from "zod";

declare global {
  var generatedAuthSecret: string | undefined;
}

function getRuntimeAuthSecret(): string {
  const configured = process.env.BETTER_AUTH_SECRET?.trim();
  if (configured) {
    return configured;
  }

  if (!global.generatedAuthSecret) {
    global.generatedAuthSecret = randomBytes(32).toString("hex");
  }

  return global.generatedAuthSecret;
}

function getRuntimeAuthUrl(): string {
  const raw =
    process.env.BETTER_AUTH_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
      : undefined) ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    (process.env.NODE_ENV === "production"
      ? "https://natures-nectar-wellness.vercel.app"
      : "http://localhost:3000");

  return raw.startsWith("http://") || raw.startsWith("https://")
    ? raw.replace(/\/+$/, "")
    : `https://${raw.replace(/\/+$/, "")}`;
}

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
});

function parseServerEnv() {
  const result = serverEnvSchema.safeParse({
    DATABASE_URL:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/natures_nectar",
    DIRECT_DATABASE_URL:
      process.env.DIRECT_DATABASE_URL ||
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/natures_nectar",
    BETTER_AUTH_SECRET: getRuntimeAuthSecret(),
    BETTER_AUTH_URL: getRuntimeAuthUrl(),
  });

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid environment variables:\n${formatted}`);
  }

  return result.data;
}

export const serverEnv = parseServerEnv();
