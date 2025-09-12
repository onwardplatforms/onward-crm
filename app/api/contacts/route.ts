import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all contacts
export async function GET(request: NextRequest) {
  try {
    const contacts = await prisma.contact.findMany({
      include: {
        company: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// POST create new contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For now, use a hardcoded user ID until auth is implemented
    const userId = "temp-user-id";
    
    // Handle "unassigned" value
    const { assignedToId, ...restData } = body;
    const contactData = {
      ...restData,
      userId,
      assignedToId: assignedToId === "unassigned" ? null : assignedToId,
    };
    
    const contact = await prisma.contact.create({
      data: contactData,
      include: {
        company: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}