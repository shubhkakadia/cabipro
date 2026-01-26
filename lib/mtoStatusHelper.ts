import { prisma } from "@/lib/db";

/**
 * Check and update MTO status based on whether all items are ordered or reserved
 * @param {string} mtoItemId - The MTO item ID to check
 * @returns {Promise<boolean>} - Returns true if status was updated, false otherwise
 */

export async function checkAndUpdateMTOStatus(mtoItemId: string) {
  try {
    // Get the MTO item to find the parent MTO
    const mtoItem = await prisma.materials_to_order_item.findUnique({
      where: { id: mtoItemId },
      select: { mto_id: true },
    });

    if (!mtoItem || !mtoItem.mto_id) {
      return false;
    }

    const mtoId = mtoItem.mto_id;

    // Get the MTO with all its items and their reservations
    const mto = await prisma.materials_to_order.findUnique({
      where: { id: mtoId },
      include: {
        items: {
          include: {
            reserve_item_stock: true,
          },
        },
      },
    });

    if (!mto || mto.items.length === 0) {
      return false;
    }

    let allItemsFullySatisfied = true;
    let someItemsSatisfied = false;

    for (const item of mto.items) {
      // Calculate total reserved quantity from all stock reservations
      const reservedQty =
        item.reserve_item_stock?.reduce(
          (sum, reservation) => sum + (reservation.quantity || 0),
          0,
        ) || 0;

      // Calculate total ordered quantity (manual + from POs)
      const orderedQty =
        (item.quantity_ordered || 0) + (item.quantity_ordered_po || 0);

      // Total satisfied quantity from all sources
      const satisfiedQty = reservedQty + orderedQty;
      const requiredQty = item.quantity || 0;

      // Check if this item is fully satisfied
      const isFullySatisfied = satisfiedQty >= requiredQty;
      const isPartiallySatisfied = satisfiedQty > 0;

      if (isPartiallySatisfied) {
        someItemsSatisfied = true;
      }

      if (!isFullySatisfied) {
        allItemsFullySatisfied = false;
      }
    }

    // Determine the new status
    let newStatus: "DRAFT" | "PARTIALLY_ORDERED" | "FULLY_ORDERED" | null =
      null;
    if (allItemsFullySatisfied) {
      newStatus = "FULLY_ORDERED";
    } else if (someItemsSatisfied) {
      newStatus = "PARTIALLY_ORDERED";
    } else {
      newStatus = "DRAFT";
    }

    // Only update if status should change and is different from current
    if (newStatus && newStatus !== mto.status) {
      await prisma.materials_to_order.update({
        where: { id: mtoId },
        data: { status: newStatus },
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error in checkAndUpdateMTOStatus:", error);
    return false;
  }
}
