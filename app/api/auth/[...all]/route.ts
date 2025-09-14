import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs"; // Use Node.js runtime for better cookie handling

export async function GET(request: NextRequest) {
  return auth.handler(request);
}

export async function POST(request: NextRequest) {
  const response = await auth.handler(request);

  // Check if this is a sign-in/sign-up request and handle cookie setting manually
  // This is a workaround for Better Auth not setting cookies via headers
  // See: https://github.com/better-auth/better-auth/issues/2434
  if (request.url.includes('/sign-in/email') || request.url.includes('/sign-up/email')) {
    try {
      const responseClone = response.clone();
      const responseData = await responseClone.json();

      // If sign-in was successful, manually set the session cookie
      if (responseData.token) {
        const cookieStore = await cookies();

        cookieStore.set('better-auth.session_token', responseData.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
    } catch (error) {
      // Silently handle errors - the response is still valid even if cookie setting fails
      if (process.env.NODE_ENV === 'development') {
        console.error("[Auth] Cookie setting error:", error);
      }
    }
  }

  return response;
}