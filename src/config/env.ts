export { serverEnv } from "@/config/env.server";
export { getWhatsAppNumber, getWhatsAppUrl } from "@/config/env.client";

export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
