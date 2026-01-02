import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";
import { formatPhoneToNational } from "@/components/validators";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
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

    const formatPhone = (phone: string | null | undefined): string | null => {
      if (!phone) return null;
      return formatPhoneToNational(phone);
    };

    const contact = await prisma.contact.create({
      data: {
        organization_id: user.organizationId,
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
      contact.id,
      "CREATE",
      `Contact created successfully: ${contact.first_name} ${contact.last_name}`
    );

    if (!logged) {
      console.error(
        `Failed to log contact creation: ${contact.id} - ${contact.first_name} ${contact.last_name}`
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Contact created successfully",
        data: contact,
        ...(logged
          ? {}
          : { warning: "Note: Creation succeeded but logging failed" }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/contact/create:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
