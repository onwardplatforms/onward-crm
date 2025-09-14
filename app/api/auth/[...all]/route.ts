import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs"; // Use Node.js runtime for better cookie handling

export async function GET(request: NextRequest) {
  console.log("[Auth Route] GET request to:", request.url);
  const response = await auth.handler(request);
  return response;
}

export async function POST(request: NextRequest) {
  console.log("[Auth Route] POST request to:", request.url);

  // Clone the request to read the body
  const clonedRequest = request.clone();
  const response = await auth.handler(request);

  // Check if this is a sign-in request and handle cookie setting manually
  if (request.url.includes('/sign-in/email') || request.url.includes('/sign-up/email')) {
    try {
      // Read the response body to get the session token
      const responseClone = response.clone();
      const responseData = await responseClone.json();

      console.log("[Auth Route] Sign-in/up response data:", JSON.stringify(responseData, null, 2));

      // Check if we have a token in the response (sign-in successful)
      if (responseData.token) {
        const cookieStore = await cookies();

        // Set the session token cookie manually
        // Better Auth expects the cookie name to be "better-auth.session_token"
        cookieStore.set('better-auth.session_token', responseData.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days (matching our session config)
        });

        console.log("[Auth Route] Manually set session cookie for token:", responseData.token);
      }
    } catch (error) {
      console.error("[Auth Route] Error handling sign-in response:", error);
    }
  }

  return response;
}