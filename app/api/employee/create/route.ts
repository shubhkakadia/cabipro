import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import {
  uploadFile,
  validateMultipartRequest,
  getFileFromFormData,
} from "@/lib/filehandler";
import { withLogging } from "@/lib/withLogging";
import { formatPhoneToNational } from "@/components/validators";

// Helper function to process date/time fields
function processDateTimeField(value: string | null | undefined): Date | null {
  if (!value || value === "" || value === "null") return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Validate and parse multipart/form-data
    const formData = await validateMultipartRequest(request);
    const body = Object.fromEntries(formData.entries());

    const imageFileResult = getFileFromFormData(formData, "image");
    const imageFile = imageFileResult instanceof File ? imageFileResult : null;
    const {
      employee_id,
      first_name,
      last_name,
      role,
      email,
      phone,
      dob,
      join_date,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      bank_account_name,
      bank_account_number,
      bank_account_bsb,
      supper_account_name,
      supper_account_number,
      tfn_number,
      abn_number,
      education,
      availability,
      notes,
      is_active,
    } = body;

    // Check if employee_id already exists in this organization
    const existingEmployee = await prisma.employees.findFirst({
      where: {
        employee_id: employee_id as string,
        organization_id: user.organizationId,
        is_deleted: false,
      },
    });

    if (existingEmployee) {
      return NextResponse.json(
        {
          status: false,
          message:
            "Employee already exists by this employee id: " + employee_id,
        },
        { status: 409 }
      );
    }

    // Parse availability JSON string to object for validation, then stringify for Prisma
    let availabilityString: string | null = null;
    if (availability !== null && availability !== undefined) {
      if (typeof availability === "string" && availability.trim() !== "") {
        // Validate it's valid JSON, but keep as string for Prisma
        try {
          JSON.parse(availability);
          availabilityString = availability;
        } catch (error) {
          console.error("Error parsing availability JSON:", error);
          return NextResponse.json(
            { status: false, message: "Invalid availability data format" },
            { status: 400 }
          );
        }
      } else if (typeof availability === "object" && availability !== null) {
        // Convert object to JSON string for Prisma
        availabilityString = JSON.stringify(availability);
      }
    }

    // Parse is_active - handle string "true"/"false" or boolean
    let isActiveValue = true; // default to true
    if (is_active !== undefined && is_active !== null) {
      if (typeof is_active === "string") {
        isActiveValue = is_active === "true";
      } else if (typeof is_active === "boolean") {
        isActiveValue = is_active;
      }
    }

    // Validate required fields
    if (!employee_id || !first_name || !role || !email || !phone) {
      return NextResponse.json(
        { status: false, message: "Required fields are missing" },
        { status: 400 }
      );
    }

    // Format phone numbers to national format before saving
    const formatPhone = (phone: string | null | undefined): string | null => {
      if (!phone) return null;
      return formatPhoneToNational(phone);
    };

    // Create employee first (without image_id)
    const employee = await prisma.employees.create({
      data: {
        organization_id: user.organizationId,
        employee_id: employee_id as string,
        first_name: first_name as string,
        last_name: (last_name as string) || null,
        role: role as string,
        email: email as string,
        phone: formatPhone(phone as string) || "",
        dob: processDateTimeField(dob as string),
        join_date: processDateTimeField(join_date as string),
        address: (address as string) || null,
        emergency_contact_name: (emergency_contact_name as string) || null,
        emergency_contact_phone: formatPhone(emergency_contact_phone as string),
        bank_account_name: (bank_account_name as string) || null,
        bank_account_number: (bank_account_number as string) || null,
        bank_account_bsb: (bank_account_bsb as string) || null,
        supper_account_name: (supper_account_name as string) || null,
        supper_account_number: (supper_account_number as string) || null,
        tfn_number: (tfn_number as string) || null,
        abn_number: (abn_number as string) || null,
        education: (education as string) || null,
        availability: availabilityString,
        notes: (notes as string) || null,
        is_active: isActiveValue,
      },
    });

    // Handle image upload if image is provided
    let imageId: string | null = null;
    if (imageFile) {
      try {
        // Upload file with ID-based naming
        const uploadResult = await uploadFile(imageFile, {
          uploadDir: "mediauploads",
          subDir: "employees",
          filenameStrategy: "id-based",
          idPrefix: employee_id as string,
        });

        // Create media record
        const media = await prisma.media.create({
          data: {
            organization_id: user.organizationId,
            url: uploadResult.relativePath,
            filename: uploadResult.originalFilename,
            file_type: "employee_photo",
            mime_type: uploadResult.mimeType,
            extension: uploadResult.extension,
            size: uploadResult.size,
            employee_id: employee.id,
          },
        });

        imageId = media.id;

        // Update employee with image_id
        await prisma.employees.update({
          where: { id: employee.id },
          data: { image_id: imageId },
        });
      } catch (error) {
        console.error("Error handling image upload:", error);
        // Continue without image if upload fails
        // Employee is already created, so we don't fail the whole request
      }
    }

    // Fetch the updated employee with image relation
    const updatedEmployee = await prisma.employees.findUnique({
      where: { id: employee.id },
      include: { image: true },
    });

    const logged = await withLogging(
      request,
      "employee",
      employee.id,
      "CREATE",
      `Employee created successfully: ${employee.first_name} ${employee.last_name}`
    );
    if (!logged) {
      console.error(
        `Failed to log employee creation: ${employee.id} - ${employee.first_name} ${employee.last_name}`
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Employee created successfully",
        ...(logged
          ? {}
          : { warning: "Note: Creation succeeded but logging failed" }),
        data: updatedEmployee,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/employee/create:", error);
    return NextResponse.json(
      { status: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
