"use client";

import { createAuthClient } from "better-auth/react";

// Get the base URL for the auth client
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    // In production, use the current origin
    if (process.env.NODE_ENV === "production") {
      return window.location.origin;
    }
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  fetchOptions: {
    credentials: "include", // Ensure cookies are sent with requests
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;