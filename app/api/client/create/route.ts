import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";
import { formatPhoneToNational } from "@/components/validators";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { type, name, address, phone, email, website, notes, contacts } =
      await request.json();

    // Check if client already exists (unique constraint: name + organization_id)
    const existingClient = await prisma.client.findFirst({
      where: {
        name: name,
        organization_id: user.organizationId,
        is_deleted: false,
      },
    });

    if (existingClient) {
      return NextResponse.json(
        {
          status: false,
          message: "Client already exists with this name: " + name,
        },
        { status: 409 },
      );
    }

    // Validate contacts if provided
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
      // Validate required fields for all contacts
      for (const contact of contacts) {
        if (!contact.first_name || !contact.last_name) {
          return NextResponse.json(
            {
              status: false,
              message: "First Name and Last Name are required for all contacts",
            },
            { status: 400 },
          );
        }
      }
    }

    const formatPhone = (phone: string | null | undefined): string | null => {
      if (!phone) return null;
      return formatPhoneToNational(phone);
    };

    // Use transaction to create client and contacts atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create the client
      const client = await tx.client.create({
        data: {
          organization_id: user.organizationId,
          type,
          name,
          address,
          phone: formatPhone(phone),
          email,
          website,
          notes,
        },
      });

      // Create contacts if provided
      const createdContacts = [];
      if (contacts && Array.isArray(contacts) && contacts.length > 0) {
        for (const contact of contacts) {
          const createdContact = await tx.contact.create({
            data: {
              organization_id: user.organizationId,
              client_id: client.id,
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email || null,
              phone: formatPhone(contact.phone) || null,
              role: contact.role || null,
              preferred_contact_method:
                contact.preferred_contact_method || null,
              notes: contact.notes || null,
            },
          });
          createdContacts.push(createdContact);
        }
      }

      return { client, createdContacts };
    });

    const { client, createdContacts } = result;

    // Log client creation
    const logged = await withLogging(
      request,
      "client",
      client.id,
      "CREATE",
      `Client created successfully: ${client.name}`,
    );

    // Log contact creations
    for (const contact of createdContacts) {
      await withLogging(
        request,
        "contact",
        contact.id,
        "CREATE",
        `Contact created successfully: ${contact.first_name} ${contact.last_name} for client: ${client.name}`,
      );
    }

    // Prepare response
    if (!logged) {
      console.error(
        `Failed to log client creation: ${client.id} - ${client.name}`,
      );
    }

    const responseData = {
      status: true,
      message: "Client created successfully",
      data: {
        ...client,
        contacts: createdContacts,
      },
      ...(logged
        ? {}
        : { warning: "Note: Creation succeeded but logging failed" }),
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/client/create:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
