import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";
import { formatPhoneToNational } from "@/components/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const contact = await prisma.contact.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { status: false, message: "Contact not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { status: true, message: "Contact fetched successfully", data: contact },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/contact/[id]:", error);
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
    const {
      first_name,
      last_name,
      email,
      role,
      phone,
      preferred_contact_method,
      notes,
      client_id,
      supplier_id,
    } = await request.json();

    // Check if contact exists and belongs to this organization
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { status: false, message: "Contact not found" },
        { status: 404 },
      );
    }

    const formatPhone = (phone: string | null | undefined): string | null => {
      if (!phone) return null;
      return formatPhoneToNational(phone);
    };

    const contact = await prisma.contact.update({
      where: { id: id },
      data: {
        first_name,
        last_name,
        email: email || null,
        role: role || null,
        phone: formatPhone(phone),
        preferred_contact_method: preferred_contact_method || null,
        notes: notes || null,
        client_id: client_id || null,
        supplier_id: supplier_id || null,
      },
    });

    const logged = await withLogging(
      request,
      "contact",
      id,
      "UPDATE",
      `Contact updated successfully: ${contact.first_name} ${contact.last_name}`,
    );

    if (!logged) {
      console.error(
        `Failed to log contact update: ${id} - ${contact.first_name} ${contact.last_name}`,
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Contact updated successfully",
        data: contact,
        ...(logged
          ? {}
          : { warning: "Note: Update succeeded but logging failed" }),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in PATCH /api/contact/[id]:", error);
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

    // Check if contact exists and belongs to this organization
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { status: false, message: "Contact not found" },
        { status: 404 },
      );
    }

    const contact = await prisma.contact.delete({
      where: { id: id },
    });

    const logged = await withLogging(
      request,
      "contact",
      id,
      "DELETE",
      `Contact deleted successfully: ${contact.first_name} ${contact.last_name}`,
    );

    if (!logged) {
      console.error(
        `Failed to log contact deletion: ${id} - ${contact.first_name} ${contact.last_name}`,
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Contact deleted successfully",
        data: contact,
        ...(logged
          ? {}
          : { warning: "Note: Deletion succeeded but logging failed" }),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in DELETE /api/contact/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
