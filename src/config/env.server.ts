import { z } from "zod";

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
    BETTER_AUTH_SECRET:
      process.env.BETTER_AUTH_SECRET ||
      "dev_secret_key_at_least_32_characters_long_12345",
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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
