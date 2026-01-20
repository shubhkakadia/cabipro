import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ version_id: string }> },
) {
  try {
    const user = await requireAuth(request);

    // Get version_id from params
    const { version_id } = await params;

    if (!version_id) {
      return NextResponse.json(
        { status: false, message: "Version ID is required" },
        { status: 400 },
      );
    }

    // Fetch the specific version with all nested details
    const version = await prisma.material_selection_versions.findFirst({
      where: {
        id: version_id,
        material_selection: {
          organization_id: user.organizationId,
        },
      },
      include: {
        areas: {
          include: {
            items: {
              orderBy: {
                name: "asc",
              },
            },
          },
          orderBy: {
            area_name: "asc",
          },
        },
        material_selection: {
          select: {
            id: true,
            lot_id: true,
            project_id: true,
            quote_id: true,
            current_version_id: true,
          },
        },
        quote: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!version) {
      return NextResponse.json(
        { status: false, message: "Version not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Version fetched successfully",
        data: version,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode },
      );
    }
    console.error("Error fetching version:", error);
    return NextResponse.json(
      { status: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
