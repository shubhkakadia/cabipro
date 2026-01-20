import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";

interface DeletedRecord {
  id: string;
  entity_id: string;
  entity_type: string;
  slug: string;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Fetch all deleted records from different tables
    const deletedEmployees = await prisma.employees.findMany({
      where: {
        is_deleted: true,
        organization_id: user.organizationId,
      },
      select: {
        id: true,
        employee_id: true,
        first_name: true,
        last_name: true,
        role: true,
        updatedAt: true,
      },
    });

    const deletedClients = await prisma.client.findMany({
      where: {
        is_deleted: true,
        organization_id: user.organizationId,
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    });

    const deletedProjects = await prisma.project.findMany({
      where: {
        is_deleted: true,
        organization_id: user.organizationId,
      },
      select: {
        id: true,
        project_id: true,
        name: true,
        lots: {
          where: { is_deleted: false },
          select: {
            name: true,
            lot_id: true,
          },
        },
        updatedAt: true,
      },
    });

    const deletedLots = await prisma.lot.findMany({
      where: {
        is_deleted: true,
        organization_id: user.organizationId,
      },
      select: {
        id: true,
        lot_id: true,
        name: true,
        updatedAt: true,
      },
    });

    const deletedItems = await prisma.item.findMany({
      where: {
        is_deleted: true,
        organization_id: user.organizationId,
      },
      select: {
        id: true,
        category: true,
        description: true,
        sheet: {
          select: {
            brand: true,
            color: true,
            finish: true,
          },
        },
        handle: {
          select: {
            brand: true,
            color: true,
            type: true,
          },
        },
        hardware: {
          select: {
            brand: true,
            name: true,
            type: true,
          },
        },
        accessory: {
          select: {
            name: true,
          },
        },
        edging_tape: {
          select: {
            brand: true,
            color: true,
            finish: true,
          },
        },
        updatedAt: true,
      },
    });

    const deletedSuppliers = await prisma.supplier.findMany({
      where: {
        is_deleted: true,
        organization_id: user.organizationId,
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    });

    // Transform data to include entity type and slug
    const allDeletedRecords: DeletedRecord[] = [];

    // Employees
    deletedEmployees.forEach((emp) => {
      allDeletedRecords.push({
        id: emp.id,
        entity_id: emp.employee_id,
        entity_type: "employee",
        slug: `${emp.first_name} ${emp.last_name || ""} ${emp.role}`.trim(),
        updatedAt: emp.updatedAt,
      });
    });

    // Clients
    deletedClients.forEach((client) => {
      allDeletedRecords.push({
        id: client.id,
        entity_id: client.id,
        entity_type: "client",
        slug: client.name,
        updatedAt: client.updatedAt,
      });
    });

    // Projects
    deletedProjects.forEach((project) => {
      const lotsCount = project.lots?.length || 0;
      const lotsNames = project.lots?.map((l) => l.name).join(", ") || "";
      allDeletedRecords.push({
        id: project.id,
        entity_id: project.project_id,
        entity_type: "project",
        slug: `${lotsCount} lot(s): ${lotsNames || project.name}`,
        updatedAt: project.updatedAt,
      });
    });

    // Lots
    deletedLots.forEach((lot) => {
      allDeletedRecords.push({
        id: lot.id,
        entity_id: lot.lot_id,
        entity_type: "lot",
        slug: `${lot.name} (${lot.lot_id})`,
        updatedAt: lot.updatedAt,
      });
    });

    // Items
    deletedItems.forEach((item) => {
      const slugParts: string[] = [String(item.category)];

      if (item.sheet) {
        const parts = [
          item.sheet.brand,
          item.sheet.color,
          item.sheet.finish,
        ].filter((p): p is string => Boolean(p));
        if (parts.length > 0) slugParts.push(...parts);
      } else if (item.handle) {
        const parts = [
          item.handle.brand,
          item.handle.color,
          item.handle.type,
        ].filter((p): p is string => Boolean(p));
        if (parts.length > 0) slugParts.push(...parts);
      } else if (item.hardware) {
        const parts = [
          item.hardware.brand,
          item.hardware.name,
          item.hardware.type,
        ].filter((p): p is string => Boolean(p));
        if (parts.length > 0) slugParts.push(...parts);
      } else if (item.accessory) {
        if (item.accessory.name) slugParts.push(item.accessory.name);
      } else if (item.edging_tape) {
        const parts = [
          item.edging_tape.brand,
          item.edging_tape.color,
          item.edging_tape.finish,
        ].filter((p): p is string => Boolean(p));
        if (parts.length > 0) slugParts.push(...parts);
      }

      if (item.description) slugParts.push(item.description);

      allDeletedRecords.push({
        id: item.id,
        entity_id: item.id,
        entity_type: "item",
        slug: slugParts.join(", ") || String(item.category),
        updatedAt: item.updatedAt,
      });
    });

    // Suppliers
    deletedSuppliers.forEach((supplier) => {
      allDeletedRecords.push({
        id: supplier.id,
        entity_id: supplier.id,
        entity_type: "supplier",
        slug: supplier.name,
        updatedAt: supplier.updatedAt,
      });
    });

    // Sort by updatedAt descending (most recently deleted first)
    allDeletedRecords.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );

    return NextResponse.json(
      {
        status: true,
        message: "Deleted records fetched successfully",
        data: allDeletedRecords,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/deletedrecords/all:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
