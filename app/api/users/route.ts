import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all team members (users)
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        title: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedContacts: true,
            assignedDeals: true,
            assignedCompanies: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST create new team member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // With Better Auth, users should be created through the auth system
    // This endpoint creates a user account that can sign in
    // We'll need to use Better Auth's API to create users properly
    
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        role: body.role || "member",
        title: body.title,
        phone: body.phone,
        isActive: body.isActive !== false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        title: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
    
    // Note: The user will need to use "forgot password" to set their password
    // Or you could send them an invitation email with a password reset link
    
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Error creating team member:", error);
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}