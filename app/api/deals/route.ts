import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all deals
export async function GET(request: NextRequest) {
  try {
    const deals = await prisma.deal.findMany({
      include: {
        company: true,
        contact: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(deals);
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

// POST create new deal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For now, use a hardcoded user ID until auth is implemented
    const userId = "temp-user-id";
    
    const deal = await prisma.deal.create({
      data: {
        ...body,
        userId,
      },
      include: {
        company: true,
        contact: true,
      },
    });
    
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error("Error creating deal:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}