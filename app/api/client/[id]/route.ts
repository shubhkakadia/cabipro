import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { AuthenticationError, requireAuth } from "@/lib/auth-middleware";
import { withLogging } from "@/lib/withLogging";
import { formatPhoneToNational } from "@/components/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: {
        id: id,
        organization_id: user.organizationId,
        is_deleted: false,
      },
      include: {
        projects: {
          where: {
            is_deleted: false,
          },
          include: {
            lots: {
              where: {
                is_deleted: false,
              },
              include: {
                stages: true,
              },
            },
          },
        },
        contacts: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { status: false, message: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: true, message: "Client fetched successfully", data: client },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error in GET /api/client/[id]:", error);
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
    const { type, name, address, phone, email, website, notes } =
      await request.json();

    const formatPhone = (phone: string | null | undefined): string | null => {
      if (!phone) return null;
      return formatPhoneToNational(phone);
    };

    await prisma.client.update({
      where: { id: id, organization_id: user.organizationId },
      data: {
        type,
        name,
        address,
        phone: formatPhone(phone),
        email,
        website,
        notes,
      },
    });

    // include projects and contacts
    const clientWithRelations = await prisma.client.findUnique({
      where: { id: id, organization_id: user.organizationId },
      include: {
        projects: {
          include: {
            lots: {
              include: {
                stages: true,
              },
            },
          },
        },
        contacts: true,
      },
    });

    if (!clientWithRelations) {
      return NextResponse.json(
        { status: false, message: "Client not found after update" },
        { status: 404 }
      );
    }

    const logged = await withLogging(
      request,
      "client",
      id,
      "UPDATE",
      `Client updated successfully: ${clientWithRelations.name}`
    );

    if (!logged) {
      console.error(
        `Failed to log client update: ${id} - ${clientWithRelations.name}`
      );
    }

    return NextResponse.json(
      {
        status: true,
        message: "Client updated successfully",
        data: clientWithRelations,
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
    console.error("Error in PATCH /api/client/[id]:", error);
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

    // Check if client exists and is not already deleted
    const existingClient = await prisma.client.findUnique({
      where: { id: id, organization_id: user.organizationId },
    });

    if (!existingClient) {
      return NextResponse.json(
        { status: false, message: "Client not found" },
        { status: 404 }
      );
    }

    if (existingClient.is_deleted) {
      return NextResponse.json(
        { status: false, message: "Client already deleted" },
        { status: 400 }
      );
    }

    // Soft delete the client record (set is_deleted flag)
    const client = await prisma.client.update({
      where: { id: id, organization_id: user.organizationId },
      data: { is_deleted: true },
    });

    const logged = await withLogging(
      request,
      "client",
      id,
      "DELETE",
      `Client deleted successfully: ${client.name}`
    );

    if (!logged) {
      console.error(`Failed to log client deletion: ${id} - ${client.name}`);
      return NextResponse.json(
        {
          status: true,
          message: "Client deleted successfully",
          data: client,
          warning: "Note: Deletion succeeded but logging failed",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: true, message: "Client deleted successfully", data: client },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error in DELETE /api/client/[id]:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
