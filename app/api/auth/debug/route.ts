import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  console.log("[Auth Debug] Starting debug check...");
  
  const debugInfo = {
    env: {
      NODE_ENV: process.env.NODE_ENV,
      BETTER_AUTH_SECRET_EXISTS: !!process.env.BETTER_AUTH_SECRET,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      VERCEL_URL: process.env.VERCEL_URL || "not set",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "not set",
    },
    cookies: {
      all: request.cookies.getAll().map(c => ({
        name: c.name,
        valueLength: c.value.length,
        firstChars: c.value.substring(0, 10) + "..."
      })),
      sessionTokenExists: !!request.cookies.get("better-auth.session_token"),
    },
    headers: {
      host: request.headers.get("host"),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      cookie: request.headers.get("cookie") ? "present" : "missing",
    },
    auth: {
      // Try to get auth config details
      configured: !!auth,
      hasHandler: typeof auth?.handler === "function",
    }
  };
  
  console.log("[Auth Debug] Debug info:", JSON.stringify(debugInfo, null, 2));
  
  return NextResponse.json(debugInfo);
}

export async function POST(request: NextRequest) {
  console.log("[Auth Debug] Testing session creation...");
  
  try {
    // Try to create a test response with a cookie
    const response = NextResponse.json({ 
      message: "Testing cookie setting",
      timestamp: new Date().toISOString() 
    });
    
    // Try to set a test cookie
    response.cookies.set("test-cookie", "test-value-" + Date.now(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
    
    console.log("[Auth Debug] Set test cookie");
    console.log("[Auth Debug] Response headers:", Object.fromEntries(response.headers.entries()));
    
    return response;
  } catch (error) {
    console.error("[Auth Debug] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}