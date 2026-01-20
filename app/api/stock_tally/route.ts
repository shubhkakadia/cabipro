import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";

/**
 * Stock Tally API
 * Handles bulk stock quantity updates from stock tally Excel import
 * Creates stock_transaction records for each change
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { items } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          status: false,
          message: "items array is required and must not be empty",
        },
        { status: 400 },
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.item_id) {
        return NextResponse.json(
          {
            status: false,
            message: "Each item must have an item_id",
          },
          { status: 400 },
        );
      }
      if (item.new_quantity === undefined || item.new_quantity === null) {
        return NextResponse.json(
          {
            status: false,
            message: "Each item must have a new_quantity",
          },
          { status: 400 },
        );
      }
      if (item.new_quantity < 0) {
        return NextResponse.json(
          {
            status: false,
            message: "new_quantity must be non-negative",
          },
          { status: 400 },
        );
      }
    }

    const results: Array<{
      item_id: string;
      supplier_reference: string | null | undefined;
      old_quantity: number;
      new_quantity: number;
      difference: number;
      type: string;
    }> = [];
    const errors: Array<{ item_id: string; error: string }> = [];

    // Process each item
    for (const itemData of items as Array<{
      item_id: string;
      new_quantity: number | string;
      current_quantity?: number | null;
    }>) {
      const { item_id, new_quantity, current_quantity } = itemData;

      try {
        // Use transaction to ensure atomicity - read and write must happen atomically
        // This prevents race conditions where another transaction modifies the item
        // between our read and write operations
        const result = await prisma.$transaction(async (tx) => {
          // Get current item within transaction to lock it
          const currentItem = await tx.item.findFirst({
            where: {
              id: item_id,
              organization_id: user.organizationId,
            },
            select: { id: true, quantity: true, supplier_reference: true },
          });

          if (!currentItem) {
            return {
              error: "Item not found or does not belong to your organization",
            };
          }

          const oldQuantity = current_quantity ?? currentItem.quantity ?? 0;
          const newQty = Math.floor(parseFloat(String(new_quantity)));
          const difference = newQty - oldQuantity;

          // Skip if no change
          if (difference === 0) {
            return { skipped: true };
          }

          // Determine transaction type
          const transactionType = difference > 0 ? "ADDED" : "WASTED";
          const quantityChange = Math.abs(difference);

          // Update item quantity and create stock transaction atomically
          await Promise.all([
            tx.item.update({
              where: { id: item_id },
              data: {
                quantity: newQty,
              },
            }),
            tx.stock_transaction.create({
              data: {
                item_id: item_id,
                quantity: quantityChange,
                type: transactionType,
                notes: `Stock tally adjustment: ${oldQuantity} → ${newQty}`,
              },
            }),
          ]);

          return {
            item_id,
            supplier_reference: currentItem.supplier_reference,
            old_quantity: oldQuantity,
            new_quantity: newQty,
            difference: difference,
            type: transactionType,
          };
        });

        // Handle transaction result
        if (result && "error" in result && typeof result.error === "string") {
          errors.push({
            item_id,
            error: result.error,
          });
        } else if (result && !("skipped" in result) && !("error" in result)) {
          results.push(result);
        }
      } catch (itemError) {
        const errorMessage =
          itemError instanceof Error ? itemError.message : "Unknown error";
        console.error(`Error processing item ${item_id}:`, itemError);
        errors.push({
          item_id,
          error: errorMessage,
        });
      }
    }

    // Log the stock tally operation
    // Use timestamp-based ID since this is a bulk operation without a single entity ID
    const tallyId = `stock-tally-${Date.now()}`;
    await withLogging(
      request,
      "stock_tally",
      tallyId,
      "CREATE",
      `Stock tally completed: ${results.length} items updated, ${errors.length} errors`,
    );

    return NextResponse.json(
      {
        status: true,
        message: `Stock tally completed: ${results.length} items updated`,
        data: {
          updated: results,
          errors: errors,
          summary: {
            total_items: items.length,
            updated_count: results.length,
            error_count: errors.length,
          },
        },
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
    console.error("Stock tally error:", error);
    console.error("Error in POST /api/stock_tally:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
