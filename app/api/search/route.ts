import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase() || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Search across all entities in parallel
    const [contacts, companies, deals, activities] = await Promise.all([
      // Search contacts
      prisma.contact.findMany({
        where: {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
            { title: { contains: query } },
          ],
        },
        include: {
          company: true,
        },
        take: 5,
      }),

      // Search companies
      prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { website: { contains: query } },
            { industry: { contains: query } },
          ],
        },
        take: 5,
      }),

      // Search deals
      prisma.deal.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { stage: { contains: query } },
          ],
        },
        include: {
          company: true,
          contact: true,
        },
        take: 5,
      }),

      // Search activities
      prisma.activity.findMany({
        where: {
          OR: [
            { subject: { contains: query } },
            { description: { contains: query } },
          ],
        },
        include: {
          contacts: true,
          deal: true,
        },
        take: 5,
      }),
    ]);

    // Format results with type information
    const results = [
      ...contacts.map((contact) => ({
        id: contact.id,
        type: "contact" as const,
        title: `${contact.firstName} ${contact.lastName}`,
        subtitle: contact.company?.name || contact.email || "",
        href: `/contacts`,
      })),
      ...companies.map((company) => ({
        id: company.id,
        type: "company" as const,
        title: company.name,
        subtitle: company.industry || company.website || "",
        href: `/companies`,
      })),
      ...deals.map((deal) => ({
        id: deal.id,
        type: "deal" as const,
        title: deal.name,
        subtitle: `${deal.stage} • $${deal.value}`,
        href: `/deals`,
      })),
      ...activities.map((activity) => ({
        id: activity.id,
        type: "activity" as const,
        title: activity.subject,
        subtitle: activity.type,
        href: `/activities`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}