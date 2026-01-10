import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { uploadFile, getFileFromFormData } from "@/lib/filehandler";
import { withLogging } from "@/lib/withLogging";
import { getOrganizationSlugFromRequest } from "@/lib/tenant";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const po = await prisma.purchase_order.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      include: {
        supplier: true,
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
        orderedBy: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        invoice_url: true,
      },
    });

    if (!po) {
      return NextResponse.json(
        { status: false, message: "Purchase order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Purchase order fetched successfully",
        data: po,
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
    console.error("Error in GET /api/purchase_order/[id]:", error);
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

    // Fetch existing PO to enforce immutable fields and get defaults (e.g., order_no for file naming)
    const existing = await prisma.purchase_order.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      include: {
        items: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { status: false, message: "Purchase order not found" },
        { status: 404 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    let body: Record<string, unknown> = {};
    let items:
      | Array<{
          id?: string;
          item_id: string;
          quantity: number | string;
          notes?: string | null;
          unit_price?: number | string | null;
        }>
      | undefined; // optional replacement list
    let uploadedInvoiceFileId: string | undefined; // new supplier_file id if a file is uploaded

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();

      // Allowed top-level fields
      const status = form.get("status") || undefined;
      const ordered_at = form.get("ordered_at") || undefined;
      const total_amount_raw = form.get("total_amount");
      const delivery_charge_raw = form.get("delivery_charge");
      const invoice_date_raw = form.get("invoice_date");
      const notes = form.get("notes") || undefined;
      const invoice_url_raw = form.get("invoice_url");

      body.status = status;
      body.ordered_at = ordered_at;
      body.total_amount =
        total_amount_raw !== null &&
        total_amount_raw !== undefined &&
        total_amount_raw !== ""
          ? Number(total_amount_raw)
          : undefined;
      body.delivery_charge =
        delivery_charge_raw !== null &&
        delivery_charge_raw !== undefined &&
        delivery_charge_raw !== ""
          ? Number(delivery_charge_raw)
          : undefined;
      body.invoice_date =
        invoice_date_raw !== null &&
        invoice_date_raw !== undefined &&
        invoice_date_raw !== "" &&
        typeof invoice_date_raw === "string"
          ? new Date(invoice_date_raw)
          : undefined;
      body.notes = notes;
      // Handle invoice_url deletion (can be "null" string or null)
      if (invoice_url_raw === "null" || invoice_url_raw === null) {
        body.invoice_url = null;
      }

      // Items can be a JSON string
      const itemsVal = form.get("items");
      if (itemsVal) {
        try {
          if (typeof itemsVal === "string") {
            let parsed: unknown;
            try {
              parsed = JSON.parse(itemsVal);
            } catch {
              const trimmed = itemsVal.trim();
              if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                try {
                  parsed = JSON.parse(`[${trimmed}]`);
                } catch {
                  parsed = undefined;
                }
              }
            }
            if (parsed && !Array.isArray(parsed)) {
              items = [parsed] as typeof items;
            } else if (Array.isArray(parsed)) {
              items = parsed as typeof items;
            }
          }
        } catch {
          // ignore malformed items
        }
      }

      // Optional invoice file upload
      const fileResult =
        getFileFromFormData(form, "invoice") ||
        getFileFromFormData(form, "file");
      const file = fileResult instanceof File ? fileResult : null;
      if (file) {
        const order_no = existing.order_no; // immutable
        
        // Get organization slug for file path
        const organizationSlug = getOrganizationSlugFromRequest(request);
        if (!organizationSlug) {
          throw new Error("Organization slug not found");
        }

        // Upload file with order_no as the filename base
        const uploadResult = await uploadFile(file, {
          subDir: "purchase_order",
          filenameStrategy: "id-based",
          idPrefix: order_no,
          organizationSlug,
        });

        const createdFile = await prisma.supplier_file.create({
          data: {
            organization_id: user.organizationId,
            url: uploadResult.relativePath,
            filename: uploadResult.originalFilename,
            file_type: "invoice",
            mime_type: uploadResult.mimeType,
            extension: uploadResult.extension,
            size: uploadResult.size,
          },
        });
        uploadedInvoiceFileId = createdFile.id;
      }
    } else {
      // JSON
      const jsonBody = (await request.json()) as Record<string, unknown>;
      body = jsonBody;
      items = jsonBody.items as typeof items;
    }

    // Build update payload (only include provided allowed fields)
    const updateData: Record<string, unknown> = {};

    // Handle invoice soft deletion if invoice_url is explicitly set to null
    if (body.invoice_url === null || body.invoice_url_id === null) {
      if (existing.invoice_url_id) {
        // Soft delete: Mark the supplier_file as deleted instead of permanently deleting
        await prisma.supplier_file.updateMany({
          where: {
            id: existing.invoice_url_id,
            organization_id: user.organizationId,
          },
          data: { is_deleted: true },
        });

        // Set invoice_url_id to null in updateData to unlink from purchase_order
        updateData.invoice_url_id = null;
      }
    }

    // Check if this is a receive operation (updating quantity_received)
    const receivedItems = body.received_items || body.items_received;
    if (receivedItems && Array.isArray(receivedItems)) {
      // This is a receive operation - update quantity_received for items and inventory
      // Filter out items with no updates (either new_delivery > 0 or quantity_received provided)
      const itemsToUpdate = receivedItems.filter(
        (item) =>
          (item.new_delivery !== undefined &&
            item.new_delivery !== null &&
            parseFloat(item.new_delivery || 0) > 0) ||
          (item.quantity_received !== undefined &&
            item.quantity_received !== null)
      );

      if (itemsToUpdate.length > 0) {
        // Fetch existing items to get current quantity_received and item_id
        const itemIds = itemsToUpdate.map((item) => item.id);
        const existingItems = await prisma.purchase_order_item.findMany({
          where: {
            id: { in: itemIds },
            order: {
              organization_id: user.organizationId,
            },
          },
          include: {
            item: {
              select: {
                id: true,
                quantity: true,
              },
            },
          },
        });

        // Create a map for quick lookup
        const existingItemsMap = new Map(
          existingItems.map((item) => [item.id, item])
        );

        // Update purchase_order_item and item inventory
        const updatePromises = itemsToUpdate.map(async (itemUpdate) => {
          const existingItem = existingItemsMap.get(itemUpdate.id);
          if (!existingItem) {
            throw new Error(`Purchase order item ${itemUpdate.id} not found`);
          }

          const currentReceived = parseInt(
            String(existingItem.quantity_received || 0),
            10
          );

          // Support both formats: quantity_received (total) or new_delivery (incremental)
          let newTotalReceived;
          let newDelivery;

          if (
            itemUpdate.quantity_received !== undefined &&
            itemUpdate.quantity_received !== null
          ) {
            // Frontend sends total quantity_received
            newTotalReceived = Math.floor(
              parseFloat(itemUpdate.quantity_received || 0)
            );
            newDelivery = newTotalReceived - currentReceived;
          } else if (
            itemUpdate.new_delivery !== undefined &&
            itemUpdate.new_delivery !== null
          ) {
            // Frontend sends incremental new_delivery
            newDelivery = Math.floor(parseFloat(itemUpdate.new_delivery || 0));
            newTotalReceived = currentReceived + newDelivery;
          } else {
            // Skip if neither is provided
            return null;
          }

          // Only update if there's actually a change
          if (newDelivery === 0) {
            return null;
          }

          // Update purchase_order_item quantity_received
          const poItemUpdate = prisma.purchase_order_item.update({
            where: { id: itemUpdate.id },
            data: {
              quantity_received: newTotalReceived,
            },
          });

          // Update item inventory quantity atomically (add new delivery to existing quantity)
          const itemUpdateOp = prisma.item.update({
            where: {
              id: existingItem.item.id,
              organization_id: user.organizationId,
            },
            data: {
              quantity: {
                increment: newDelivery,
              },
            },
          });

          return Promise.all([poItemUpdate, itemUpdateOp]);
        });

        // Filter out null values (skipped items) before awaiting
        const validPromises = updatePromises.filter((p) => p !== null);
        if (validPromises.length > 0) {
          await Promise.all(validPromises);
        }
      }

      // Check if all items are fully received to update PO status
      const updatedPO = await prisma.purchase_order.findFirst({
        where: {
          id: id,
          organization_id: user.organizationId,
        },
        include: {
          items: true,
        },
      });

      if (!updatedPO) {
        return NextResponse.json(
          { status: false, message: "Purchase order not found" },
          { status: 404 }
        );
      }

      const allItemsReceived = updatedPO.items.every(
        (item) => (item.quantity_received || 0) >= item.quantity
      );
      const someItemsReceived = updatedPO.items.some(
        (item) => (item.quantity_received || 0) > 0
      );

      let newStatus = existing.status;
      if (allItemsReceived && existing.status !== "CANCELLED") {
        newStatus = "FULLY_RECEIVED";
      } else if (
        someItemsReceived &&
        !allItemsReceived &&
        existing.status !== "CANCELLED"
      ) {
        newStatus = "PARTIALLY_RECEIVED";
      }

      // Fetch updated PO with all relations for return
      const finalPO = await prisma.purchase_order.findFirst({
        where: {
          id: id,
          organization_id: user.organizationId,
        },
        include: {
          supplier: true,
          mto: {
            select: {
              id: true,
              project: {
                select: { id: true, project_id: true, name: true },
              },
              status: true,
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
                },
              },
            },
          },
          orderedBy: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          invoice_url: true,
        },
      });

      if (!finalPO) {
        return NextResponse.json(
          { status: false, message: "Purchase order not found" },
          { status: 404 }
        );
      }

      // Apply status update if needed
      if (newStatus !== existing.status) {
        await prisma.purchase_order.update({
          where: { id },
          data: { status: newStatus },
        });
        // Update finalPO status for response
        (finalPO as typeof finalPO & { status: typeof newStatus }).status =
          newStatus;
      }

      return NextResponse.json(
        {
          status: true,
          message: "Received quantities updated successfully",
          data: finalPO,
        },
        { status: 200 }
      );
    }
    if (body.status !== undefined) {
      // Validate status value
      const validStatuses = [
        "DRAFT",
        "ORDERED",
        "PARTIALLY_RECEIVED",
        "FULLY_RECEIVED",
        "CANCELLED",
      ];
      const statusValue = String(body.status);
      if (!validStatuses.includes(statusValue)) {
        return NextResponse.json(
          {
            status: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
      updateData.status = statusValue;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (
      body.total_amount !== undefined &&
      body.total_amount !== null &&
      body.total_amount !== ""
    )
      updateData.total_amount = Number(body.total_amount);
    if (
      body.delivery_charge !== undefined &&
      body.delivery_charge !== null &&
      body.delivery_charge !== ""
    )
      updateData.delivery_charge = Number(body.delivery_charge);
    if (
      body.invoice_date !== undefined &&
      body.invoice_date !== null &&
      body.invoice_date !== ""
    )
      updateData.invoice_date =
        body.invoice_date instanceof Date
          ? body.invoice_date
          : new Date(String(body.invoice_date));
    if (
      body.ordered_at !== undefined &&
      body.ordered_at !== null &&
      body.ordered_at !== ""
    )
      updateData.ordered_at =
        body.ordered_at instanceof Date
          ? body.ordered_at
          : new Date(String(body.ordered_at));
    if (uploadedInvoiceFileId)
      updateData.invoice_url_id = uploadedInvoiceFileId;

    // Handle items update with proper upsert logic to preserve quantity_received
    if (items !== undefined) {
      // Use transaction to ensure atomic updates
      await prisma.$transaction(async (tx) => {
        if (Array.isArray(items) && items.length > 0) {
          // Get existing items for this purchase order
          const existingItems = await tx.purchase_order_item.findMany({
            where: {
              order_id: id,
              order: {
                organization_id: user.organizationId,
              },
            },
          });

          // Create maps for efficient lookup
          const existingById = new Map(
            existingItems.map((item) => [item.id, item])
          );
          const existingByItemId = new Map(
            existingItems.map((item) => [item.item_id, item])
          );
          const incomingItemIds = new Set();

          // Process each incoming item
          for (const item of items as Array<{
            id?: string;
            item_id: string;
            quantity: number | string;
            notes?: string | null;
            unit_price?: number | string | null;
          }>) {
            const itemData = {
              item_id: item.item_id,
              quantity: Number(item.quantity),
              notes: item.notes || null,
              unit_price:
                item.unit_price !== undefined &&
                item.unit_price !== null &&
                item.unit_price !== ""
                  ? Number(item.unit_price)
                  : null,
            };

            // Check if item exists by ID (preferred) or by item_id
            const existingItem =
              item.id && existingById.has(item.id)
                ? existingById.get(item.id)
                : existingByItemId.get(item.item_id);

            if (existingItem) {
              // Update existing item, preserving quantity_received
              incomingItemIds.add(existingItem.id);
              await tx.purchase_order_item.update({
                where: { id: existingItem.id },
                data: {
                  ...itemData,
                  // Preserve quantity_received - don't overwrite it
                  quantity_received: existingItem.quantity_received || 0,
                },
              });
            } else {
              // Create new item
              const newItem = await tx.purchase_order_item.create({
                data: {
                  ...itemData,
                  order_id: id,
                  quantity_received: 0, // New items start with 0 received
                },
              });
              incomingItemIds.add(newItem.id);
            }
          }

          // Delete items that are no longer in the incoming list
          const itemsToDelete = existingItems.filter(
            (item) => !incomingItemIds.has(item.id)
          );
          if (itemsToDelete.length > 0) {
            await tx.purchase_order_item.deleteMany({
              where: {
                id: { in: itemsToDelete.map((item) => item.id) },
              },
            });
          }
        } else {
          // Empty array - delete all items
          await tx.purchase_order_item.deleteMany({
            where: {
              order_id: id,
              order: {
                organization_id: user.organizationId,
              },
            },
          });
        }
      });
    }

    const updated = await prisma.purchase_order.update({
      where: { id },
      data: updateData,
      include: {
        mto: {
          select: {
            id: true,
            project: {
              select: { id: true, project_id: true, name: true },
            },
            status: true,
          },
        },
        supplier: true,
        items: {
          include: {
            item: {
              include: {
                sheet: true,
                handle: true,
                hardware: true,
                accessory: true,
              },
            },
          },
        },
        orderedBy: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        invoice_url: true,
      },
    });

    const logged = await withLogging(
      request,
      "purchase_order",
      id,
      "UPDATE",
      `Purchase order updated successfully for project: ${updated.mto?.project?.name}`
    );
    if (!logged) {
      console.error(`Failed to log purchase order update: ${id}`);
    }
    return NextResponse.json(
      {
        status: true,
        message: "Purchase order updated successfully",
        data: updated,
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
    console.error("Error in PATCH /api/purchase_order/[id]:", error);
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

    // Fetch PO with project info before deletion for logging
    const poForLogging = await prisma.purchase_order.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      include: {
        mto: {
          select: {
            id: true,
            project: {
              select: { id: true, project_id: true, name: true },
            },
          },
        },
      },
    });

    if (!poForLogging) {
      return NextResponse.json(
        { status: false, message: "Purchase order not found" },
        { status: 404 }
      );
    }

    const po = await prisma.purchase_order.delete({
      where: { id },
    });

    const logged = await withLogging(
      request,
      "purchase_order",
      id,
      "DELETE",
      `Purchase order deleted successfully for project: ${
        poForLogging.mto?.project?.name || "Unknown"
      }`
    );

    if (!logged) {
      console.error(`Failed to log purchase order deletion: ${id}`);
      return NextResponse.json(
        {
          status: true,
          message: "Purchase order deleted successfully",
          data: po,
          warning: "Note: Deletion succeeded but logging failed",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Purchase order deleted successfully",
        data: po,
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
    console.error("Error in DELETE /api/purchase_order/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
