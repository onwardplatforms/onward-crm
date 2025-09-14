import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export const runtime = "nodejs"; // Use Node.js runtime for better cookie handling

// The nextCookies plugin handles cookie operations for us
export async function GET(request: NextRequest) {
  console.log("[Auth Route] GET request to:", request.url);
  return auth.handler(request);
}

export async function POST(request: NextRequest) {
  console.log("[Auth Route] POST request to:", request.url);
  const response = await auth.handler(request);

  // Log for debugging
  const setCookieHeaders = response.headers.getSetCookie();
  if (setCookieHeaders && setCookieHeaders.length > 0) {
    console.log("[Auth Route] Set-Cookie headers:", setCookieHeaders);
  }

  return response;
}