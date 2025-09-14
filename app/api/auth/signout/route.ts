import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  // Clear the session cookie
  cookieStore.delete("better-auth.session_token");

  // Also try to clear any other potential auth cookies
  cookieStore.delete("better-auth.session-token");
  cookieStore.delete("session-token");

  return NextResponse.json({ success: true });
}