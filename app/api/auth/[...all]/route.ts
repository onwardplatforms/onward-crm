import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs"; // Use Node.js runtime for better cookie handling

// Helper to manually set cookies from Set-Cookie headers
async function handleAuthResponse(response: Response): Promise<NextResponse> {
  const setCookieHeaders = response.headers.getSetCookie();

  // Create a NextResponse from the original response
  const nextResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });

  // Manually set cookies if they exist in the response
  if (setCookieHeaders && setCookieHeaders.length > 0) {
    console.log("[Auth Route] Found Set-Cookie headers:", setCookieHeaders);

    const cookieStore = await cookies();

    for (const setCookieHeader of setCookieHeaders) {
      // Parse the Set-Cookie header
      const [cookiePair, ...attributes] = setCookieHeader.split(';').map(s => s.trim());
      const [name, value] = cookiePair.split('=');

      // Parse cookie attributes
      const cookieOptions: {
        value: string;
        path: string;
        httpOnly: boolean;
        secure: boolean;
        sameSite: 'lax' | 'strict' | 'none';
        maxAge?: number;
        expires?: Date;
        domain?: string;
      } = {
        value,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      };

      for (const attr of attributes) {
        const [key, val] = attr.split('=');
        const lowerKey = key.toLowerCase();

        if (lowerKey === 'max-age') {
          cookieOptions.maxAge = parseInt(val);
        } else if (lowerKey === 'expires') {
          cookieOptions.expires = new Date(val);
        } else if (lowerKey === 'path') {
          cookieOptions.path = val;
        } else if (lowerKey === 'domain') {
          cookieOptions.domain = val;
        } else if (lowerKey === 'samesite') {
          cookieOptions.sameSite = val.toLowerCase() as 'lax' | 'strict' | 'none';
        } else if (lowerKey === 'secure') {
          cookieOptions.secure = true;
        } else if (lowerKey === 'httponly') {
          cookieOptions.httpOnly = true;
        }
      }

      console.log(`[Auth Route] Setting cookie ${name} with options:`, cookieOptions);

      // Set the cookie using Next.js cookies API
      cookieStore.set(name, cookieOptions.value, {
        path: cookieOptions.path,
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        expires: cookieOptions.expires,
        domain: cookieOptions.domain,
      });
    }
  }

  return nextResponse;
}

export async function GET(request: NextRequest) {
  console.log("[Auth Route] GET request to:", request.url);
  const response = await auth.handler(request);
  return handleAuthResponse(response);
}

export async function POST(request: NextRequest) {
  console.log("[Auth Route] POST request to:", request.url);
  const response = await auth.handler(request);
  return handleAuthResponse(response);
}