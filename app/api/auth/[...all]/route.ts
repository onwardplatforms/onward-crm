import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  console.log("[Auth Route] GET request to:", request.url);
  const response = await auth.handler(request);
  console.log("[Auth Route] GET response status:", response.status);
  console.log("[Auth Route] GET response headers:", Object.fromEntries(response.headers.entries()));
  return response;
}

export async function POST(request: NextRequest) {
  console.log("[Auth Route] POST request to:", request.url);
  console.log("[Auth Route] POST headers:", Object.fromEntries(request.headers.entries()));
  
  const response = await auth.handler(request);
  
  console.log("[Auth Route] POST response status:", response.status);
  console.log("[Auth Route] POST response headers:", Object.fromEntries(response.headers.entries()));
  
  // Log set-cookie headers specifically
  const setCookieHeaders = response.headers.getSetCookie();
  console.log("[Auth Route] Set-Cookie headers:", setCookieHeaders);
  
  return response;
}