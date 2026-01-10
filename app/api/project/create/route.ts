import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";

// Helper function to process date/time fields
function processDateTimeField(value: string | null | undefined): Date | null {
  if (!value || value === "" || value === "null") return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { name, project_id, client_id, startDate, lots } =
      await request.json();

    // Normalize client_id - handle empty string, null, or undefined
    const normalizedClientId =
      client_id && typeof client_id === "string" && client_id.trim() !== ""
        ? client_id.trim()
        : null;

    // Check if project already exists in this organization
    const existingProject = await prisma.project.findFirst({
      where: {
        project_id: project_id.toLowerCase(),
        organization_id: user.organizationId,
      },
    });

    if (existingProject) {
      return NextResponse.json(
        {
          status: false,
          message: "Project already exists by this project id: " + project_id,
        },
        { status: 409 }
      );
    }

    // Validate client_id if provided
    let clientIdForProject: string | null = null;
    if (normalizedClientId) {
      const existingClient = await prisma.client.findFirst({
        where: {
          id: normalizedClientId,
          organization_id: user.organizationId,
        },
      });

      if (!existingClient) {
        return NextResponse.json(
          {
            status: false,
            message: "Client not found",
          },
          { status: 404 }
        );
      }

      clientIdForProject = existingClient.id;
    }

    // Validate lots if provided
    if (lots && Array.isArray(lots) && lots.length > 0) {
      // Validate required fields for all lots
      for (const lot of lots) {
        if (!lot.lotId || !lot.clientName) {
          return NextResponse.json(
            {
              status: false,
              message: "Lot ID and Client Name are required for all lots",
            },
            { status: 400 }
          );
        }
      }
    }

    // Use transaction to create project and lots atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create the project
      const project = await tx.project.create({
        data: {
          organization_id: user.organizationId,
          name,
          project_id: project_id.toLowerCase(),
          client_id: clientIdForProject,
        },
      });

      // Create lots if provided
      const createdLots = [];
      if (lots && Array.isArray(lots) && lots.length > 0) {
        for (const lot of lots) {
          const createdLot = await tx.lot.create({
            data: {
              organization_id: user.organizationId,
              lot_id: lot.lotId.toLowerCase(),
              name: lot.clientName,
              project_id: project.id,
              startDate: startDate ? processDateTimeField(startDate) : null,
              installationDueDate: lot.installationDueDate
                ? processDateTimeField(lot.installationDueDate)
                : null,
              notes: lot.notes || null,
              status: "ACTIVE",
            },
          });
          createdLots.push(createdLot);
        }
      }

      return { project, createdLots };
    });

    const { project, createdLots } = result;

    // Log project creation
    const logged = await withLogging(
      request,
      "project",
      project.id,
      "CREATE",
      `Project created successfully: ${project.name}`
    );

    // Log lot creations
    for (const lot of createdLots) {
      await withLogging(
        request,
        "lot",
        lot.id,
        "CREATE",
        `Lot created successfully: ${lot.name} for project: ${project.name}`
      );
    }

    // Prepare response
    const responseData: {
      status: boolean;
      message: string;
      data: typeof project & { lots: typeof createdLots };
      warning?: string;
    } = {
      status: true,
      message: "Project created successfully",
      data: {
        ...project,
        lots: createdLots,
      },
    };

    if (!logged) {
      console.error(
        `Failed to log project creation: ${project.id} - ${project.name}`
      );
      responseData.warning = "Note: Creation succeeded but logging failed";
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error in POST /api/project/create:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error", error: errorMessage },
      { status: 500 }
    );
  }
}
