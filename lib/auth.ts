import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

// Get the base URL for the application
const getBaseURL = () => {
  // Auto-detect from Vercel if available (for preview deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Use public URL or fallback to localhost
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  baseURL: getBaseURL(),
  trustedOrigins: [
    "https://onward-crm.vercel.app",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    "http://localhost:3333",
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [
    nextCookies(), // Handles Next.js specific cookie operations
  ],
});