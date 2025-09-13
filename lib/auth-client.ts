"use client";

import { createAuthClient } from "better-auth/react";

// In production, use relative URL. In development, use localhost
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    // Client-side: use relative URL in production, localhost in dev
    if (process.env.NODE_ENV === "production") {
      return ""; // Empty string means use relative URLs
    }
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;