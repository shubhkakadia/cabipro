import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import {
  uploadFile,
  deleteFileByRelativePath,
  getFileFromFormData,
} from "@/lib/filehandler";
import { withLogging } from "@/lib/withLogging";
import { getOrganizationSlugFromRequest } from "@/lib/tenant";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const item = await prisma.item.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
        is_deleted: false,
      },
      include: {
        image: true,
        sheet: true,
        handle: true,
        hardware: true,
        accessory: true,
        edging_tape: true,
        supplier: true,
        materials_to_order_items: true,
        purchase_order_item: true,
        reserve_item_stock: {
          include: {
            mto: {
              include: {
                mto: {
                  include: {
                    project: {
                      select: {
                        name: true,
                      },
                    },
                    lots: {
                      select: {
                        lot_id: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { status: false, message: "Item not found" },
        { status: 404 },
      );
    }

    // Fetch stock transactions separately for all types (ADDED, USED, WASTED)
    const stock_transactions = await prisma.stock_transaction.findMany({
      where: {
        item_id: id,
        item: {
          organization_id: user.organizationId,
        },
      },
      include: {
        purchase_order: {
          select: {
            order_no: true,
          },
        },
        materials_to_order: {
          include: {
            project: {
              select: {
                name: true,
              },
            },
            lots: {
              select: {
                lot_id: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Attach stock_transactions to item
    const itemWithTransactions = {
      ...item,
      stock_transactions,
    };

    return NextResponse.json(
      {
        status: true,
        message: "Item fetched successfully",
        data: itemWithTransactions,
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
    console.error("Error in GET /api/item/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      const errorMessage =
        parseError instanceof Error ? parseError.message : "Unknown error";
      console.error("FormData parse error:", parseError);
      return NextResponse.json(
        {
          status: false,
          message: "Failed to parse form data",
          error: errorMessage,
        },
        { status: 400 },
      );
    }

    const description = formData.get("description");
    const price = formData.get("price");
    const quantity = formData.get("quantity");
    const imageFileResult = getFileFromFormData(formData, "image");
    const imageFile = imageFileResult instanceof File ? imageFileResult : null;
    const brand = formData.get("brand");
    const color = formData.get("color");
    const finish = formData.get("finish");
    const face = formData.get("face");
    const dimensions = formData.get("dimensions");
    const type = formData.get("type");
    const material = formData.get("material");
    const name = formData.get("name");
    const sub_category = formData.get("sub_category");
    const supplier_id = formData.get("supplier_id");
    const measurement_unit = formData.get("measurement_unit");
    const supplier_reference = formData.get("supplier_reference");
    const supplier_product_link = formData.get("supplier_product_link");

    // Handle is_sunmica - FormData sends booleans as strings
    const is_sunmicaValue = formData.get("is_sunmica");
    const is_sunmica =
      typeof is_sunmicaValue === "string" &&
      (is_sunmicaValue === "true" || is_sunmicaValue === "1");

    // check if item already exists
    const existingItem = await prisma.item.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      include: { image: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { status: false, message: "Item does not exist" },
        { status: 404 },
      );
    }

    // Prepare update data - only include fields that are provided
    const updateData: Record<string, unknown> = {};
    if (description !== null && description !== undefined)
      updateData.description =
        typeof description === "string" ? description : null;
    if (price !== null && price !== undefined)
      updateData.price =
        typeof price === "string" && price ? parseFloat(price) : null;
    if (quantity !== null && quantity !== undefined)
      updateData.quantity =
        typeof quantity === "string" && quantity ? parseInt(quantity) : null;
    if (supplier_id !== null && supplier_id !== undefined)
      updateData.supplier_id =
        typeof supplier_id === "string" && supplier_id ? supplier_id : null;
    if (measurement_unit !== null && measurement_unit !== undefined)
      updateData.measurement_unit =
        typeof measurement_unit === "string" ? measurement_unit : null;
    if (supplier_reference !== null && supplier_reference !== undefined)
      updateData.supplier_reference =
        typeof supplier_reference === "string" ? supplier_reference : null;
    if (supplier_product_link !== null && supplier_product_link !== undefined)
      updateData.supplier_product_link =
        typeof supplier_product_link === "string"
          ? supplier_product_link
          : null;

    // Update item first (without image_id)
    await prisma.item.update({
      where: { id: id },
      data: updateData,
    });

    // Handle image removal if imageFile is empty string
    if (imageFileResult === "") {
      try {
        if (existingItem.image_id && existingItem.image) {
          // Store the image URL and ID before removing the reference
          const imageUrl = existingItem.image.url;
          const imageId = existingItem.image_id;

          // First, update item to remove image_id (remove foreign key reference)
          await prisma.item.update({
            where: { id: id },
            data: { image_id: null },
          });

          // Now safe to delete the media record (no foreign key constraint)
          await prisma.media.delete({
            where: { id: imageId },
          });

          // Finally, delete the file from disk
          await deleteFileByRelativePath(imageUrl);
        }
      } catch (error) {
        console.error("Error handling image removal:", error);
        // Continue even if removal fails
      }
    }
    // Handle file upload if image is provided
    else if (imageFile && imageFile instanceof File) {
      try {
        // Store old image info before processing new image
        const oldImageUrl =
          existingItem.image_id && existingItem.image
            ? existingItem.image.url
            : null;
        const oldImageId = existingItem.image_id || null;

        // Get organization slug for file path
        const organizationSlug = getOrganizationSlugFromRequest(request);
        if (!organizationSlug) {
          throw new Error("Organization slug not found");
        }

        // Upload new image FIRST (before deleting old one)
        const uploadResult = await uploadFile(imageFile, {
          subDir: `items/${existingItem.category.toLowerCase()}`,
          filenameStrategy: "id-based",
          idPrefix: id,
          organizationSlug,
        });

        // If there's an old image, remove the item_id reference first to avoid unique constraint violation
        if (oldImageId) {
          // First, remove the foreign key reference from item
          await prisma.item.update({
            where: { id: id },
            data: { image_id: null },
          });

          // Now safe to delete the old media record (no foreign key constraint)
          try {
            await prisma.media.delete({
              where: { id: oldImageId },
            });
          } catch (deleteError) {
            // Log but continue - old media might already be deleted
            console.error(
              "Error deleting old media record (non-critical):",
              deleteError,
            );
          }
        }

        // Create new media record (now safe since old one is deleted)
        const media = await prisma.media.create({
          data: {
            organization_id: user.organizationId,
            url: uploadResult.relativePath,
            filename: uploadResult.originalFilename,
            file_type: uploadResult.fileType,
            mime_type: uploadResult.mimeType,
            extension: uploadResult.extension,
            size: uploadResult.size,
            item_id: id,
          },
        });

        // Update item with new image_id
        await prisma.item.update({
          where: { id: id },
          data: { image_id: media.id },
        });

        // Delete the old file from disk (if it exists)
        if (oldImageUrl) {
          try {
            await deleteFileByRelativePath(oldImageUrl);
          } catch (deleteError) {
            // Log but don't fail the entire operation if old file deletion fails
            console.error(
              "Error deleting old image file (non-critical):",
              deleteError,
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error("Error handling image upload:", error);
        console.error("Upload error details:", {
          message: errorMessage,
          stack: errorStack,
          imageFile: imageFile
            ? {
                name: imageFile.name,
                size: imageFile.size,
                type: imageFile.type,
              }
            : null,
        });
        // Return error instead of silently failing
        return NextResponse.json(
          {
            status: false,
            message: "Failed to upload image",
            error: errorMessage,
          },
          { status: 500 },
        );
      }
    }

    // Update category-specific data
    const categoryLower = existingItem.category.toLowerCase();
    if (categoryLower === "sheet") {
      const sheetData: Record<string, unknown> = {};
      if (brand !== null && brand !== undefined)
        sheetData.brand = typeof brand === "string" ? brand : null;
      if (color !== null && color !== undefined)
        sheetData.color = typeof color === "string" ? color : null;
      if (finish !== null && finish !== undefined)
        sheetData.finish = typeof finish === "string" ? finish : null;
      if (face !== null && face !== undefined)
        sheetData.face = typeof face === "string" ? face : null;
      if (dimensions !== null && dimensions !== undefined)
        sheetData.dimensions =
          typeof dimensions === "string" ? dimensions : null;
      // Update is_sunmica if provided
      if (is_sunmicaValue !== null && is_sunmicaValue !== undefined) {
        sheetData.is_sunmica = is_sunmica;
      }

      if (Object.keys(sheetData).length > 0) {
        await prisma.sheet.update({
          where: { item_id: id },
          data: sheetData,
        });
      }
    } else if (categoryLower === "handle") {
      const handleData: Record<string, unknown> = {};
      if (brand !== null && brand !== undefined)
        handleData.brand = typeof brand === "string" ? brand : null;
      if (color !== null && color !== undefined)
        handleData.color = typeof color === "string" ? color : null;
      if (type !== null && type !== undefined)
        handleData.type = typeof type === "string" ? type : null;
      if (dimensions !== null && dimensions !== undefined)
        handleData.dimensions =
          typeof dimensions === "string" ? dimensions : null;
      if (material !== null && material !== undefined)
        handleData.material = typeof material === "string" ? material : null;

      if (Object.keys(handleData).length > 0) {
        await prisma.handle.update({
          where: { item_id: id },
          data: handleData,
        });
      }
    } else if (categoryLower === "hardware") {
      const hardwareData: Record<string, unknown> = {};
      if (brand !== null && brand !== undefined)
        hardwareData.brand = typeof brand === "string" ? brand : null;
      if (name !== null && name !== undefined)
        hardwareData.name = typeof name === "string" ? name : null;
      if (type !== null && type !== undefined)
        hardwareData.type = typeof type === "string" ? type : null;
      if (dimensions !== null && dimensions !== undefined)
        hardwareData.dimensions =
          typeof dimensions === "string" ? dimensions : null;
      if (sub_category !== null && sub_category !== undefined)
        hardwareData.sub_category =
          typeof sub_category === "string" ? sub_category.toLowerCase() : null;
      if (Object.keys(hardwareData).length > 0) {
        await prisma.hardware.update({
          where: { item_id: id },
          data: hardwareData,
        });
      }
    } else if (categoryLower === "accessory") {
      const accessoryData: Record<string, unknown> = {};
      if (name !== null && name !== undefined)
        accessoryData.name = typeof name === "string" ? name : null;

      if (Object.keys(accessoryData).length > 0) {
        await prisma.accessory.update({
          where: { item_id: id },
          data: accessoryData,
        });
      }
    } else if (categoryLower === "edging_tape") {
      const edging_tapeData: Record<string, unknown> = {};
      if (brand !== null && brand !== undefined)
        edging_tapeData.brand = typeof brand === "string" ? brand : null;
      if (color !== null && color !== undefined)
        edging_tapeData.color = typeof color === "string" ? color : null;
      if (finish !== null && finish !== undefined)
        edging_tapeData.finish = typeof finish === "string" ? finish : null;
      if (dimensions !== null && dimensions !== undefined)
        edging_tapeData.dimensions =
          typeof dimensions === "string" ? dimensions : null;
      if (Object.keys(edging_tapeData).length > 0) {
        await prisma.edging_tape.update({
          where: { item_id: id },
          data: edging_tapeData,
        });
      }
    }

    // Fetch the complete updated item with all relations
    const completeItem = await prisma.item.findUnique({
      where: { id: id },
      include: {
        image: true,
        sheet: true,
        handle: true,
        hardware: true,
        accessory: true,
        supplier: true,
        edging_tape: true,
        materials_to_order_items: true,
        purchase_order_item: true,
        reserve_item_stock: {
          include: {
            mto: {
              include: {
                mto: {
                  include: {
                    project: {
                      select: {
                        name: true,
                      },
                    },
                    lots: {
                      select: {
                        lot_id: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!completeItem) {
      return NextResponse.json(
        { status: false, message: "Item not found after update" },
        { status: 404 },
      );
    }

    // Fetch stock transactions separately for all types (ADDED, USED, WASTED)
    const stock_transactions = await prisma.stock_transaction.findMany({
      where: {
        item_id: id,
        item: {
          organization_id: user.organizationId,
        },
      },
      include: {
        purchase_order: {
          select: {
            order_no: true,
          },
        },
        materials_to_order: {
          include: {
            project: {
              select: {
                name: true,
              },
            },
            lots: {
              select: {
                lot_id: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Attach stock_transactions to item
    const itemWithTransactions = {
      ...completeItem,
      stock_transactions,
    };

    const logged = await withLogging(
      request,
      "item",
      id,
      "UPDATE",
      `Item updated successfully: ${completeItem.description || id}`,
    );
    if (!logged) {
      console.error(
        `Failed to log item update: ${id} - ${completeItem.description || id}`,
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Item updated successfully",
        data: itemWithTransactions,
        ...(logged
          ? {}
          : { warning: "Note: Update succeeded but logging failed" }),
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
    console.error("Error in PATCH /api/item/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const item = await prisma.item.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
      include: { image: true },
    });

    if (!item) {
      return NextResponse.json(
        { status: false, message: "Item not found" },
        { status: 404 },
      );
    }

    if (item.is_deleted) {
      return NextResponse.json(
        { status: false, message: "Item already deleted" },
        { status: 400 },
      );
    }

    // Handle image file soft deletion if exists
    if (item.image_id && item.image) {
      try {
        // Soft delete the media record instead of hard deleting
        await prisma.media.update({
          where: { id: item.image_id },
          data: { is_deleted: true },
        });
      } catch (error) {
        console.error("Error handling image soft deletion:", error);
        // Continue with item soft deletion even if image soft deletion fails
      }
    }

    // Soft delete the item record (set is_deleted flag)
    const deletedItem = await prisma.item.update({
      where: { id: id },
      data: { is_deleted: true },
    });

    const logged = await withLogging(
      request,
      "item",
      id,
      "DELETE",
      `Item deleted successfully: ${item.description || id}`,
    );
    if (!logged) {
      console.error(
        `Failed to log item deletion: ${id} - ${item.description || id}`,
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Item deleted successfully",
        data: deletedItem,
        ...(logged
          ? {}
          : { warning: "Note: Deletion succeeded but logging failed" }),
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
    console.error("Error in DELETE /api/item/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
