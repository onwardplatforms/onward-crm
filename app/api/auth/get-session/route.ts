import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (session) {
      return NextResponse.json(session);
    }
    
    return NextResponse.json(null);
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(null);
  }
}