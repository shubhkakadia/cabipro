import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const mto = await prisma.materials_to_order.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      include: {
        lots: {
          include: {
            project: true,
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
                image: true,
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

    if (!mto) {
      return NextResponse.json(
        { status: false, message: "Materials to order not found" },
        { status: 404 }
      );
    }

    // Fetch media separately to avoid Prisma client issues
    const media = await prisma.media.findMany({
      where: {
        materials_to_orderId: id,
        organization_id: user.organizationId,
        is_deleted: false,
      },
    });

    // Add media to the response
    const mtoWithMedia = {
      ...mto,
      media: media,
    };

    return NextResponse.json(
      {
        status: true,
        message: "Materials to order fetched successfully",
        data: mtoWithMedia,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error in GET /api/materials_to_order/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const data = await request.json();
    const { status, notes, items, used_material_completed } = data;

    // Verify MTO exists and belongs to this organization
    const existingMto = await prisma.materials_to_order.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!existingMto) {
      return NextResponse.json(
        { status: false, message: "Materials to order not found" },
        { status: 404 }
      );
    }

    // Build the update data object
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (used_material_completed !== undefined) {
      updateData.used_material_completed = used_material_completed;
    }

    // Handle items updates
    if (items !== undefined) {
      updateData.items = {
        // Delete all existing items first, then create new ones
        deleteMany: {},
        create: items.map(
          (item: {
            item_id: string;
            quantity: number;
            notes?: string | null;
          }) => ({
            item_id: item.item_id,
            quantity: item.quantity,
            notes: item.notes || null,
          })
        ),
      };
    }

    const includeMto = {
      lots: {
        include: {
          project: true,
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
              image: true,
            },
          },
        },
      },
      project: {
        include: {
          lots: true,
        },
      },
    };

    type MtoWithIncludes = Awaited<
      ReturnType<typeof prisma.materials_to_order.findFirst<{ include: typeof includeMto }>>
    >;

    let mto: MtoWithIncludes | null = null;
    await prisma.$transaction(async (tx) => {
      const prev = await tx.materials_to_order.findFirst({
        where: {
          id: id,
          organization_id: user.organizationId,
        },
        select: { used_material_completed: true },
      });

      if (!prev) {
        throw new Error("Materials to order not found");
      }

      // One-way process: once completed, it cannot be reverted
      if (used_material_completed === false) {
        throw new Error("USED_MATERIAL_COMPLETION_CANNOT_BE_REVERTED");
      }

      // Update MTO (including optional items update)
      mto = await tx.materials_to_order.update({
        where: { id },
        data: updateData,
        include: includeMto,
      });

      const turningCompleted =
        used_material_completed === true && !prev.used_material_completed;

      // When marking completed, create USED stock transactions for remaining qty
      if (turningCompleted) {
        const mtoItems = await tx.materials_to_order_item.findMany({
          where: {
            mto_id: id,
            mto: {
              organization_id: user.organizationId,
            },
          },
          select: {
            id: true,
            item_id: true,
            quantity: true,
            quantity_used: true,
          },
        });

        for (const it of mtoItems) {
          const used = it.quantity_used || 0;
          const total = it.quantity || 0;
          const remaining = total - used;
          if (remaining <= 0) continue;

          // Decrement inventory for remaining qty (guard against negative)
          const dec = await tx.item.updateMany({
            where: {
              id: it.item_id,
              organization_id: user.organizationId,
              quantity: { gte: remaining },
            },
            data: { quantity: { decrement: remaining } },
          });

          if (dec.count === 0) {
            const current = await tx.item.findFirst({
              where: {
                id: it.item_id,
                organization_id: user.organizationId,
              },
              select: { quantity: true },
            });
            const available = current?.quantity ?? 0;
            throw new Error(
              `INSUFFICIENT_INVENTORY:${it.item_id}:${remaining}:${available}`
            );
          }

          // Mark item fully used
          await tx.materials_to_order_item.update({
            where: { id: it.id },
            data: { quantity_used: total },
          });

          // Create USED stock transaction for remaining qty
          await tx.stock_transaction.create({
            data: {
              item_id: it.item_id,
              quantity: remaining,
              type: "USED",
              materials_to_order_id: id,
              notes: `Auto USED on marking MTO completed (${id})`,
            },
          });
        }

        // Re-fetch MTO so response shows updated quantity_used values
        mto = await tx.materials_to_order.findFirst({
          where: {
            id: id,
            organization_id: user.organizationId,
          },
          include: includeMto,
        });
      }
    });

    if (!mto) {
      return NextResponse.json(
        { status: false, message: "Failed to fetch updated MTO" },
        { status: 500 }
      );
    }

    // Fetch media separately
    const media = await prisma.media.findMany({
      where: {
        materials_to_orderId: id,
        organization_id: user.organizationId,
        is_deleted: false,
      },
    });

    // Add media to the response (mto is guaranteed to be non-null after the check above)
    const mtoNonNull = mto as NonNullable<MtoWithIncludes>;
    const mtoWithMedia = {
      ...mtoNonNull,
      media: media,
    };

    const projectName = mtoNonNull.project?.name || "Unknown";
    const logged = await withLogging(
      request,
      "materials_to_order",
      id,
      "UPDATE",
      `Materials to order updated successfully for project: ${projectName}`
    );

    if (!logged) {
      console.error(`Failed to log materials to order update: ${id}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Materials to order updated successfully",
        data: mtoWithMedia,
        ...(logged
          ? {}
          : { warning: "Note: Update succeeded but logging failed" }),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.startsWith("INSUFFICIENT_INVENTORY:")) {
      const parts = errorMessage.split(":");
      const requested = parts[2] || "unknown";
      const available = parts[3] || "unknown";
      return NextResponse.json(
        {
          status: false,
          message: `Not enough quantity in inventory. Available: ${available}, Requested: ${requested}`,
        },
        { status: 400 }
      );
    }

    if (errorMessage === "USED_MATERIAL_COMPLETION_CANNOT_BE_REVERTED") {
      return NextResponse.json(
        {
          status: false,
          message:
            "This MTO is already completed for used material and cannot be moved back to active.",
        },
        { status: 400 }
      );
    }

    if (errorMessage === "Materials to order not found") {
      return NextResponse.json(
        { status: false, message: errorMessage },
        { status: 404 }
      );
    }

    console.error("Error in PATCH /api/materials_to_order/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Fetch MTO with project info before deletion for logging
    const mtoForLogging = await prisma.materials_to_order.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      include: {
        project: true,
      },
    });

    if (!mtoForLogging) {
      return NextResponse.json(
        { status: false, message: "Materials to order not found" },
        { status: 404 }
      );
    }

    // Update lots to remove reference to this MTO
    await prisma.lot.updateMany({
      where: {
        materials_to_orders_id: id,
        organization_id: user.organizationId,
      },
      data: { materials_to_orders_id: null },
    });

    // Mark media as deleted (soft delete)
    await prisma.media.updateMany({
      where: {
        materials_to_orderId: id,
        organization_id: user.organizationId,
      },
      data: { is_deleted: true },
    });

    const mto = await prisma.materials_to_order.delete({
      where: { id },
    });

    const logged = await withLogging(
      request,
      "materials_to_order",
      id,
      "DELETE",
      `Materials to order deleted successfully for project: ${mtoForLogging?.project?.name || "Unknown"}`
    );

    if (!logged) {
      console.error(`Failed to log materials to order deletion: ${id}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Materials to order deleted successfully",
        data: mto,
        ...(logged
          ? {}
          : { warning: "Note: Deletion succeeded but logging failed" }),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error in DELETE /api/materials_to_order/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
