import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // Use Node.js runtime for better cookie handling

export async function GET(request: NextRequest) {
  console.log("[Auth Route] GET request to:", request.url);

  try {
    const response = await auth.handler(request);
    console.log("[Auth Route] GET response status:", response.status);
    console.log("[Auth Route] GET response headers:", Object.fromEntries(response.headers.entries()));

    return response;
  } catch (error) {
    console.error("[Auth Route] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("[Auth Route] POST request to:", request.url);
  console.log("[Auth Route] POST headers:", Object.fromEntries(request.headers.entries()));

  try {
    const response = await auth.handler(request);

    console.log("[Auth Route] POST response status:", response.status);
    console.log("[Auth Route] POST response headers:", Object.fromEntries(response.headers.entries()));

    // Log set-cookie headers specifically
    const setCookieHeaders = response.headers.getSetCookie();
    console.log("[Auth Route] Set-Cookie headers:", setCookieHeaders);

    return response;
  } catch (error) {
    console.error("[Auth Route] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}