import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const contacts = await prisma.contact.findMany({
      where: {
        organization_id: user.organizationId,
      },
    });

    return NextResponse.json(
      {
        status: true,
        message: "Contacts fetched successfully",
        data: contacts,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/contact/all:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
