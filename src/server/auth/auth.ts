import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { serverEnv } from "@/config/env.server";
import { getSiteUrl } from "@/config/site";
import { db } from "@/server/db/prisma";

const trustedOrigins = Array.from(
  new Set([
    "http://localhost:3000",
    "https://*.run.app",
    "https://*.vercel.app",
    serverEnv.BETTER_AUTH_URL,
    getSiteUrl(),
    ...(process.env.APP_URL ? [process.env.APP_URL] : []),
  ])
);

export const auth = betterAuth({
  baseURL: serverEnv.BETTER_AUTH_URL,
  trustedOrigins,
  secret: serverEnv.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});
