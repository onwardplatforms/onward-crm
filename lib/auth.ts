import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

// Get the base URL for the application
const getBaseURL = () => {
  // Auto-detect from Vercel if available (for preview deployments)
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    console.log("[Auth Config] Using VERCEL_URL:", url);
    return url;
  }
  // Use public URL or fallback to localhost
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";
  console.log("[Auth Config] Using fallback URL:", url);
  return url;
};

console.log("[Auth Config] Initializing with:");
console.log("  - NODE_ENV:", process.env.NODE_ENV);
console.log("  - BETTER_AUTH_SECRET exists:", !!process.env.BETTER_AUTH_SECRET);
console.log("  - Base URL:", getBaseURL());

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
  },
  baseURL: getBaseURL(),
  trustedOrigins: [
    "https://onward-crm.vercel.app",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    "http://localhost:3333",
  ],
  advanced: {
    cookies: {
      session_token: {
        name: "better-auth.session_token",
        attributes: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        },
      },
    },
  },
});