import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import {
  uploadFile,
  validateMultipartRequest,
  getFileFromFormData,
} from "@/lib/filehandler";
import { withLogging } from "@/lib/withLogging";
import { getOrganizationSlugFromRequest } from "@/lib/tenant";
import type { Category } from "@/generated/prisma/enums";

const CATEGORIES = ["sheet", "handle", "hardware", "accessory", "edging_tape"];

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Validate and parse multipart/form-data
    const formData = await validateMultipartRequest(request);

    const description = formData.get("description");
    const price = formData.get("price");
    const quantity = formData.get("quantity");
    const imageFileResult = getFileFromFormData(formData, "image");
    const imageFile = imageFileResult instanceof File ? imageFileResult : null;

    const categoryValue = formData.get("category");
    const category =
      typeof categoryValue === "string" ? categoryValue.toLowerCase() : null;

    if (!category || !CATEGORIES.includes(category)) {
      return NextResponse.json(
        { status: false, message: "Invalid category" },
        { status: 400 }
      );
    }

    const brand = formData.get("brand");
    const color = formData.get("color");
    const finish = formData.get("finish");
    const face = formData.get("face");
    const dimensions = formData.get("dimensions");
    const type = formData.get("type");
    const material = formData.get("material");
    const name = formData.get("name");
    const sub_categoryValue = formData.get("sub_category");
    const sub_category =
      typeof sub_categoryValue === "string"
        ? sub_categoryValue.toLowerCase()
        : "";
    const supplier_id = formData.get("supplier_id");
    const measurement_unit = formData.get("measurement_unit");
    const supplier_reference = formData.get("supplier_reference");
    const supplier_product_link = formData.get("supplier_product_link");

    // Handle is_sunmica - FormData sends booleans as strings
    const is_sunmicaValue = formData.get("is_sunmica");
    const is_sunmica =
      typeof is_sunmicaValue === "string" &&
      (is_sunmicaValue === "true" || is_sunmicaValue === "1");

    // Prepare category-specific data based on category type
    let categoryData: Record<string, unknown> = {};
    if (category === "sheet") {
      categoryData = {
        sheet: {
          create: {
            brand: typeof brand === "string" ? brand : null,
            color: typeof color === "string" ? color : null,
            finish: typeof finish === "string" ? finish : null,
            face: typeof face === "string" ? face : null,
            dimensions: typeof dimensions === "string" ? dimensions : null,
            is_sunmica: is_sunmica || false,
          },
        },
      };
    } else if (category === "handle") {
      categoryData = {
        handle: {
          create: {
            brand: typeof brand === "string" ? brand : null,
            color: typeof color === "string" ? color : null,
            type: typeof type === "string" ? type : null,
            dimensions: typeof dimensions === "string" ? dimensions : null,
            material: typeof material === "string" ? material : null,
          },
        },
      };
    } else if (category === "hardware") {
      categoryData = {
        hardware: {
          create: {
            brand: typeof brand === "string" ? brand : null,
            name: typeof name === "string" ? name : null,
            type: typeof type === "string" ? type : null,
            dimensions: typeof dimensions === "string" ? dimensions : null,
            sub_category: sub_category || null,
          },
        },
      };
    } else if (category === "accessory") {
      categoryData = {
        accessory: {
          create: {
            name: typeof name === "string" ? name : null,
          },
        },
      };
    } else if (category === "edging_tape") {
      categoryData = {
        edging_tape: {
          create: {
            brand: typeof brand === "string" ? brand : null,
            color: typeof color === "string" ? color : null,
            finish: typeof finish === "string" ? finish : null,
            dimensions: typeof dimensions === "string" ? dimensions : null,
          },
        },
      };
    }

    // Use transaction to atomically create item and category-specific record
    // This prevents "ghost items" if category creation fails
    const createdItem = await prisma.$transaction(async (tx) => {
      // Create item with nested category-specific record in a single atomic operation
      return await tx.item.create({
        data: {
          organization_id: user.organizationId,
          description: typeof description === "string" ? description : null,
          price: typeof price === "string" && price ? parseFloat(price) : null,
          quantity:
            typeof quantity === "string" && quantity
              ? parseInt(quantity)
              : null,
          category: category.toUpperCase() as Category,
          supplier_id:
            typeof supplier_id === "string" && supplier_id ? supplier_id : null,
          measurement_unit:
            typeof measurement_unit === "string" ? measurement_unit : null,
          supplier_reference:
            typeof supplier_reference === "string" ? supplier_reference : null,
          supplier_product_link:
            typeof supplier_product_link === "string"
              ? supplier_product_link
              : null,
          ...categoryData,
        },
        include: {
          sheet: true,
          handle: true,
          hardware: true,
          accessory: true,
          edging_tape: true,
        },
      });
    });

    let imageId: string | null = null;

    // Handle file upload if image is provided
    // This happens after the transaction to avoid file system operations in the transaction
    if (imageFile) {
      try {
        // Get organization slug for file path
        const organizationSlug = getOrganizationSlugFromRequest(request);
        if (!organizationSlug) {
          throw new Error("Organization slug not found");
        }

        // Upload file with ID-based naming
        const uploadResult = await uploadFile(imageFile, {
          subDir: `items/${category}`,
          filenameStrategy: "id-based",
          idPrefix: createdItem.id,
          organizationSlug,
        });

        // Create media record and update item with image_id in a transaction
        await prisma.$transaction(async (tx) => {
          const media = await tx.media.create({
            data: {
              organization_id: user.organizationId,
              url: uploadResult.relativePath,
              filename: uploadResult.originalFilename,
              file_type: uploadResult.fileType,
              mime_type: uploadResult.mimeType,
              extension: uploadResult.extension,
              size: uploadResult.size,
              item_id: createdItem.id,
            },
          });

          imageId = media.id;

          await tx.item.update({
            where: { id: createdItem.id },
            data: { image_id: imageId },
          });
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Error handling image upload:", error);
        console.error("Upload error details:", {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
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
          { status: 500 }
        );
      }
    }

    // Fetch the updated item with image relation (if image was uploaded)
    const updatedItem = await prisma.item.findUnique({
      where: { id: createdItem.id },
      include: {
        image: true,
        sheet: true,
        handle: true,
        hardware: true,
        accessory: true,
        edging_tape: true,
      },
    });

    // Log the creation
    const itemDescription =
      (typeof description === "string" && description) || `Item (${category})`;
    const logged = await withLogging(
      request,
      "item",
      createdItem.id,
      "CREATE",
      `Item created successfully: ${itemDescription}`
    );
    if (!logged) {
      console.error(
        `Failed to log item creation: ${createdItem.id} - ${itemDescription}`
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Item created successfully",
        ...(logged
          ? {}
          : { warning: "Note: Creation succeeded but logging failed" }),
        data: updatedItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
