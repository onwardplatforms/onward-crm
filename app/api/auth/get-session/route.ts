import { auth } from "@/lib/auth";
import { getCurrentWorkspace } from "@/lib/workspace";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (session?.user?.id) {
      // Get the current workspace for this user
      const workspace = await getCurrentWorkspace(session.user.id, session.session?.id);
      
      return NextResponse.json({
        ...session,
        workspace
      });
    }
    
    return NextResponse.json(null);
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(null);
  }
}