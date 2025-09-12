import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/signin", "/signup", "/api/auth"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow public routes and API auth routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session token cookie
  const sessionToken = request.cookies.get("better-auth.session_token");
  
  if (!sessionToken) {
    // Redirect to signin if not authenticated (for non-API routes)
    if (!pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    // For API routes, return 401
    return NextResponse.json(
      { error: "Unauthorized - No session" },
      { status: 401 }
    );
  }

  // For API routes, we need to get the session from Better Auth
  // But we can't import auth directly in middleware due to Edge Runtime limitations
  // So we'll make a request to our auth endpoint to validate the session
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    console.log("Middleware: Processing API route:", pathname);
    try {
      // Call our auth API to get session info
      const sessionResponse = await fetch(new URL("/api/auth/get-session", request.url), {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });
      
      console.log("Middleware: Session response status:", sessionResponse.status);
      
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        console.log("Middleware: Session data:", JSON.stringify(session, null, 2));
        
        if (session?.user?.id) {
          // Add user info and workspace to headers for API routes
          const requestHeaders = new Headers(request.headers);
          requestHeaders.set("x-user-id", session.user.id);
          requestHeaders.set("x-user-email", session.user.email || "");
          requestHeaders.set("x-session-id", session.session?.id || "");
          requestHeaders.set("x-workspace-id", session.workspace?.id || "");
          
          console.log("Middleware: Setting workspace ID:", session.workspace?.id);
          
          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
        }
      }
    } catch (error) {
      console.error("Middleware session check error:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};