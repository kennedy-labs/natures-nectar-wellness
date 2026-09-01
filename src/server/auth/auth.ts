import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { serverEnv } from "@/config/env.server";
import { db } from "@/server/db/prisma";

export const auth = betterAuth({
  baseURL: serverEnv.BETTER_AUTH_URL,

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
