import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth(request);

    // Fetch MTOs that are fully ordered but NOT yet marked as used_material_completed
    // (Completed MTOs are fetched separately in the frontend)
    const completedMTOs = await prisma.materials_to_order.findMany({
      where: {
        organization_id: user.organizationId,
        status: "FULLY_ORDERED",
        used_material_completed: false, // Exclude MTOs already marked as completed
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                image: true,
                sheet: true,
                handle: true,
                hardware: true,
                accessory: true,
                edging_tape: true,
                supplier: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            ordered_items: {
              include: {
                order: {
                  select: {
                    id: true,
                    order_no: true,
                    status: true,
                  },
                },
              },
            },
            reserve_item_stock: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        purchase_order: {
          select: {
            id: true,
            order_no: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Separate MTOs into two categories:
    // 1. Ready to use: All materials have been received
    // 2. Upcoming: Some materials are still pending
    const readyToUse: typeof completedMTOs = [];
    const upcoming: typeof completedMTOs = [];

    completedMTOs.forEach((mto) => {
      // Skip MTOs without items
      if (!mto.items || mto.items.length === 0) {
        return;
      }

      // Check if all items are ready (either received via PO or reserved from stock)
      const allItemsReceived = mto.items.every((item) => {
        // Calculate total reserved quantity from all stock reservations
        const totalReserved = (item.reserve_item_stock || []).reduce(
          (sum, reservation) => sum + (reservation.quantity || 0),
          0,
        );

        // Calculate how much has been used
        const quantityUsed = Number(item.quantity_used || 0);

        // Check if there's AVAILABLE reserved stock (not fully used)
        // Since we no longer delete entries, we need to check available quantity
        const availableReservedStock = (item.reserve_item_stock || []).reduce(
          (sum, reservation) => {
            const available =
              (reservation.quantity || 0) - (reservation.used_quantity || 0);
            return sum + available;
          },
          0,
        );
        const hasAvailableReservedStock = availableReservedStock > 0;

        // Check if this item has received purchase orders
        const hasReceivedPO = item.ordered_items?.some(
          (orderedItem) => orderedItem.order?.status === "FULLY_RECEIVED",
        );

        // FALLBACK: For cases where mto_item_id wasn't set on PO items
        // Check if: (1) the item is fully ordered AND (2) the MTO has at least one fully received PO
        // This handles existing POs that don't have the foreign key relationship established
        const quantityOrderedPO = Number(item.quantity_ordered_po || 0);
        const quantityRequired = Number(item.quantity || 0);
        const isFullyOrdered =
          quantityOrderedPO >= quantityRequired && quantityRequired > 0;

        const mtoHasReceivedPO = mto.purchase_order?.some(
          (po) => po.status === "FULLY_RECEIVED",
        );
        const fullyOrderedAndReceived = isFullyOrdered && mtoHasReceivedPO;

        // Item is ready if it has available reserved stock OR received PO OR (fully ordered AND MTO has received POs)
        return (
          hasAvailableReservedStock || hasReceivedPO || fullyOrderedAndReceived
        );
      });

      // Calculate statistics
      const totalItems = mto.items.length;
      const totalQuantity = mto.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0,
      );

      // Calculate how many items are received vs pending
      let receivedItems = 0;
      let pendingItems = 0;

      mto.items.forEach((item) => {
        // Calculate total reserved quantity
        const totalReserved = (item.reserve_item_stock || []).reduce(
          (sum, reservation) => sum + (reservation.quantity || 0),
          0,
        );
        const quantityUsed = Number(item.quantity_used || 0);

        // Check available reserved stock (not fully used)
        const availableReservedStock = (item.reserve_item_stock || []).reduce(
          (sum, reservation) => {
            const available =
              (reservation.quantity || 0) - (reservation.used_quantity || 0);
            return sum + available;
          },
          0,
        );
        const hasAvailableReservedStock = availableReservedStock > 0;

        const hasReceivedPO = item.ordered_items?.some(
          (orderedItem) => orderedItem.order?.status === "FULLY_RECEIVED",
        );

        if (hasAvailableReservedStock || hasReceivedPO) {
          receivedItems++;
        } else {
          pendingItems++;
        }
      });

      // Group items by supplier
      const supplierGroups = new Map();
      mto.items.forEach((item) => {
        const supplierId = item.item?.supplier?.id || "unassigned";
        const supplierName = item.item?.supplier?.name || "Unassigned";

        if (!supplierGroups.has(supplierId)) {
          supplierGroups.set(supplierId, {
            id: supplierId,
            name: supplierName,
            item_count: 0,
            items: [],
          });
        }

        const group = supplierGroups.get(supplierId);
        group.item_count++;
        group.items.push(item);
      });

      const enrichedMTO = {
        ...mto,
        statistics: {
          total_items: totalItems,
          total_quantity: totalQuantity,
          received_items: receivedItems,
          pending_items: pendingItems,
          suppliers: Array.from(supplierGroups.values()),
        },
        is_ready: allItemsReceived,
      };

      // Add to appropriate category
      if (allItemsReceived) {
        readyToUse.push(enrichedMTO);
      } else {
        upcoming.push(enrichedMTO);
      }
    });

    // Fetch completed MTOs (where used_material_completed = true)
    const completedMTOsData = await prisma.materials_to_order.findMany({
      where: {
        organization_id: user.organizationId,
        used_material_completed: true,
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                image: true,
                sheet: true,
                handle: true,
                hardware: true,
                accessory: true,
                edging_tape: true,
                supplier: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            ordered_items: {
              include: {
                order: {
                  select: {
                    id: true,
                    order_no: true,
                    status: true,
                  },
                },
              },
            },
            reserve_item_stock: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        purchase_order: {
          select: {
            id: true,
            order_no: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        status: true,
        data: {
          ready_to_use: readyToUse,
          upcoming: upcoming,
          completed: completedMTOsData,
        },
        counts: {
          ready_to_use: readyToUse.length,
          upcoming: upcoming.length,
          completed: completedMTOsData.length,
          total: readyToUse.length + upcoming.length + completedMTOsData.length,
        },
        message: "Used material list fetched successfully",
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error fetching used material list:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        status: false,
        message: "Internal server error",
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
