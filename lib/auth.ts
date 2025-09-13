import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

// Get the base URL for the application
const getBaseURL = () => {
  // In production on Vercel, use the VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // In development or if NEXT_PUBLIC_APP_URL is set
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  baseURL: getBaseURL(),
});