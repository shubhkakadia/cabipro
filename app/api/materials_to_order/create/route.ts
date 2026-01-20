import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const data = await request.json();
    const { project_id, notes, items, lot_ids } = data;

    // Verify project exists and belongs to this organization if provided
    let projectUuid: string | undefined;
    if (project_id) {
      const project = await prisma.project.findFirst({
        where: {
          project_id: project_id,
          organization_id: user.organizationId,
        },
        select: { id: true },
      });

      if (!project) {
        return NextResponse.json(
          { status: false, message: "Project not found" },
          { status: 404 },
        );
      }
      projectUuid = project.id;
    }

    // Verify lots exist and belong to this organization if provided
    let lotUuids: string[] = [];
    if (lot_ids && lot_ids.length > 0) {
      const lots = await prisma.lot.findMany({
        where: {
          lot_id: { in: lot_ids },
          organization_id: user.organizationId,
        },
        select: { id: true },
      });

      if (lots.length !== lot_ids.length) {
        return NextResponse.json(
          { status: false, message: "One or more lots not found" },
          { status: 404 },
        );
      }
      lotUuids = lots.map((lot) => lot.id);
    }

    // Use transaction to atomically create MTO and update lots
    const mto = await prisma.$transaction(async (tx) => {
      // Create materials_to_order
      const newMto = await tx.materials_to_order.create({
        data: {
          organization_id: user.organizationId,
          ...(projectUuid && { project_id: projectUuid }),
          notes,
          createdBy_id: user.userId,
          items:
            items && items.length > 0
              ? {
                  create: items.map(
                    (item: {
                      item_id: string;
                      quantity: number;
                      notes?: string | null;
                    }) => ({
                      item: {
                        connect: {
                          id: item.item_id,
                        },
                      },
                      quantity: item.quantity,
                      notes: item.notes || null,
                    }),
                  ),
                }
              : undefined,
        },
      });

      // Assign lots to this MTO atomically
      if (lotUuids.length > 0) {
        await tx.lot.updateMany({
          where: {
            id: { in: lotUuids },
            organization_id: user.organizationId,
          },
          data: { materials_to_orders_id: newMto.id },
        });
      }

      return newMto;
    });

    // Fetch the complete MTO with all relations
    const completeMto = await prisma.materials_to_order.findUnique({
      where: { id: mto.id },
      include: {
        lots: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        items: {
          include: {
            item: {
              include: {
                sheet: true,
                handle: true,
                hardware: true,
                accessory: true,
                edging_tape: true,
              },
            },
          },
        },
        project: {
          include: {
            lots: true,
          },
        },
      },
    });

    if (!completeMto) {
      return NextResponse.json(
        { status: false, message: "Failed to fetch created MTO" },
        { status: 500 },
      );
    }

    // Fetch media separately
    const media = await prisma.media.findMany({
      where: {
        materials_to_orderId: mto.id,
        organization_id: user.organizationId,
        is_deleted: false,
      },
    });

    // Add media to the response
    const mtoWithMedia = {
      ...completeMto,
      media: media,
    };

    const projectName = completeMto.project?.name || "No Project";
    const logged = await withLogging(
      request,
      "materials_to_order",
      mto.id,
      "CREATE",
      `Materials to order created successfully${
        completeMto.project ? ` for project: ${projectName}` : ""
      }`,
    );

    if (!logged) {
      console.error(`Failed to log materials to order creation: ${mto.id}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Materials to order created successfully",
        data: mtoWithMedia,
        ...(logged
          ? {}
          : { warning: "Note: Creation succeeded but logging failed" }),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode },
      );
    }
    console.error("Error in POST /api/materials_to_order/create:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
