import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { uploadFile, getFileFromFormData } from "@/lib/filehandler";
import { withLogging } from "@/lib/withLogging";
import { getOrganizationSlugFromRequest } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const contentType = request.headers.get("content-type") || "";

    let supplier_id: string | undefined;
    let mto_id: string | undefined;
    let order_no: string | undefined;
    let orderedBy_id: string | undefined;
    let invoice_url_id: string | undefined; // may be set if file uploaded
    let total_amount: number | undefined;
    let delivery_charge: number | undefined;
    let invoice_date: Date | undefined;
    let notes: string | undefined;
    let items:
      | Array<{
          item_id: string;
          quantity: number | string;
          notes?: string | null;
          unit_price?: number | string | null;
        }>
      | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();

      supplier_id =
        typeof form.get("supplier_id") === "string"
          ? (form.get("supplier_id") as string)
          : undefined;
      mto_id =
        typeof form.get("mto_id") === "string"
          ? (form.get("mto_id") as string)
          : undefined;
      order_no =
        typeof form.get("order_no") === "string"
          ? (form.get("order_no") as string)
          : undefined;
      orderedBy_id =
        typeof form.get("orderedBy_id") === "string"
          ? (form.get("orderedBy_id") as string)
          : undefined;
      notes =
        typeof form.get("notes") === "string"
          ? (form.get("notes") as string)
          : undefined;

      const totalAmountStr = form.get("total_amount");
      total_amount =
        totalAmountStr !== null && totalAmountStr !== undefined
          ? Number(totalAmountStr)
          : undefined;

      const deliveryChargeStr = form.get("delivery_charge");
      delivery_charge =
        deliveryChargeStr !== null &&
        deliveryChargeStr !== undefined &&
        deliveryChargeStr !== ""
          ? Number(deliveryChargeStr)
          : undefined;

      const invoiceDateStr = form.get("invoice_date");
      invoice_date =
        invoiceDateStr !== null &&
        invoiceDateStr !== undefined &&
        invoiceDateStr !== "" &&
        typeof invoiceDateStr === "string"
          ? new Date(invoiceDateStr)
          : undefined;

      const itemsVal = form.get("items");
      if (itemsVal) {
        try {
          if (typeof itemsVal === "string") {
            let parsed: unknown;
            try {
              parsed = JSON.parse(itemsVal);
            } catch {
              // Support comma-separated object list without [ ]
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
            } else {
              items = undefined;
            }
          } else if (Array.isArray(itemsVal)) {
            items = itemsVal as typeof items;
          } else {
            items = undefined;
          }
        } catch {
          items = undefined;
        }
      }

      const fileResult =
        getFileFromFormData(form, "invoice") ||
        getFileFromFormData(form, "file");
      const file = fileResult instanceof File ? fileResult : null;
      if (file) {
        if (!order_no) {
          return NextResponse.json(
            {
              status: false,
              message: "order_no is required when uploading a file",
            },
            { status: 400 }
          );
        }

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
        invoice_url_id = createdFile.id;
      }
    } else {
      const body = (await request.json()) as Record<string, unknown>;
      supplier_id = body.supplier_id as string | undefined;
      mto_id = body.mto_id as string | undefined;
      order_no = body.order_no as string | undefined;
      orderedBy_id = body.orderedBy_id as string | undefined;
      invoice_url_id = body.invoice_url_id as string | undefined;
      total_amount = body.total_amount as number | undefined;
      delivery_charge = body.delivery_charge as number | undefined;
      invoice_date = body.invoice_date
        ? new Date(body.invoice_date as string)
        : undefined;
      notes = body.notes as string | undefined;
      items = body.items as typeof items;
    }

    if (!supplier_id) {
      return NextResponse.json(
        { status: false, message: "supplier_id is required" },
        { status: 400 }
      );
    }

    // Verify supplier exists and belongs to this organization
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplier_id,
        organization_id: user.organizationId,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { status: false, message: "Supplier not found" },
        { status: 404 }
      );
    }

    // mto_id is optional per schema; do not require it
    if (!order_no) {
      return NextResponse.json(
        { status: false, message: "order_no is required" },
        { status: 400 }
      );
    }

    // Check if order_no already exists in this organization
    const existingPO = await prisma.purchase_order.findFirst({
      where: {
        order_no: order_no,
        organization_id: user.organizationId,
      },
    });

    if (existingPO) {
      return NextResponse.json(
        {
          status: false,
          message:
            "Purchase order already exists with this order_no: " + order_no,
        },
        { status: 409 }
      );
    }

    // Verify MTO exists and belongs to this organization if provided
    if (mto_id) {
      const mto = await prisma.materials_to_order.findFirst({
        where: {
          id: mto_id,
          organization_id: user.organizationId,
        },
      });

      if (!mto) {
        return NextResponse.json(
          { status: false, message: "Materials to order not found" },
          { status: 404 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create PO and items
      const createdPO = await tx.purchase_order.create({
        data: {
          organization_id: user.organizationId,
          supplier_id,
          mto_id: mto_id || null,
          order_no,
          orderedBy_id: orderedBy_id || null,
          invoice_url_id: invoice_url_id || null,
          total_amount: total_amount || null,
          delivery_charge: delivery_charge || null,
          invoice_date: invoice_date || null,
          notes: notes || null,
          items:
            Array.isArray(items) && items.length > 0
              ? {
                  create: items.map((item) => ({
                    item_id: item.item_id,
                    quantity: Number(item.quantity),
                    notes: item.notes || null,
                    unit_price:
                      item.unit_price !== undefined &&
                      item.unit_price !== null &&
                      item.unit_price !== ""
                        ? Number(item.unit_price)
                        : null,
                  })),
                }
              : undefined,
        },
        include: { items: true },
      });

      // If linked to an MTO and items provided, update MTOI quantities and MTO status
      if (createdPO.mto_id && createdPO.items && createdPO.items.length > 0) {
        // Fetch all MTO items for the MTO
        const mtoItems = await tx.materials_to_order_item.findMany({
          where: {
            mto_id: createdPO.mto_id,
            mto: {
              organization_id: user.organizationId,
            },
          },
          select: {
            id: true,
            item_id: true,
            quantity: true,
            quantity_ordered_po: true,
          },
        });

        const itemIdToMtoItem = new Map(mtoItems.map((mi) => [mi.item_id, mi]));

        // Apply cumulative ordered quantity per matching item
        for (const poi of createdPO.items) {
          const mtoItem = itemIdToMtoItem.get(poi.item_id);
          if (!mtoItem) continue;
          const alreadyOrdered = Number(mtoItem.quantity_ordered_po || 0);
          const orderedThisPO = Number(poi.quantity || 0);
          const cappedOrdered = Math.min(
            Number(mtoItem.quantity),
            alreadyOrdered + orderedThisPO
          );
          if (cappedOrdered !== alreadyOrdered) {
            await tx.materials_to_order_item.update({
              where: { id: mtoItem.id },
              data: { quantity_ordered_po: cappedOrdered },
            });
            // Update local copy for later status calculation
            mtoItem.quantity_ordered_po = cappedOrdered;
          }
        }

        // Determine MTO status based on whether all items are fully ordered
        const allFullyOrdered =
          mtoItems.length > 0 &&
          mtoItems.every(
            (mi) =>
              Number(mi.quantity_ordered_po || 0) === Number(mi.quantity || 0)
          );
        await tx.materials_to_order.update({
          where: {
            id: createdPO.mto_id,
            organization_id: user.organizationId,
          },
          data: {
            status: allFullyOrdered ? "FULLY_ORDERED" : "PARTIALLY_ORDERED",
          },
        });
      }

      return createdPO;
    });

    const logged = await withLogging(
      request,
      "purchase_order",
      result.id,
      "CREATE",
      `Purchase order created successfully: ${result.order_no}`
    );

    if (!logged) {
      console.error(`Failed to log purchase order creation: ${result.id}`);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Purchase order created successfully",
        data: result,
        ...(logged
          ? {}
          : { warning: "Note: Creation succeeded but logging failed" }),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error in POST /api/purchase_order/create:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
