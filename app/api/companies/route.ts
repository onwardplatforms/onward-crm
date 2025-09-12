import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all companies
export async function GET(request: NextRequest) {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            contacts: true,
            deals: true,
          },
        },
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
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// POST create new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For now, use a hardcoded user ID until auth is implemented
    const userId = "temp-user-id";
    
    // Handle "unassigned" value
    const { assignedToId, ...restData } = body;
    const companyData = {
      ...restData,
      userId,
      assignedToId: assignedToId === "unassigned" ? null : assignedToId,
    };
    
    const company = await prisma.company.create({
      data: companyData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}