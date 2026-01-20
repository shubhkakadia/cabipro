import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthenticationError } from "@/lib/auth-middleware";
import { Category } from "@/generated/prisma/enums";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { search } = await request.json();

    if (!search || typeof search !== "string" || search.trim() === "") {
      return NextResponse.json(
        { status: false, message: "Search term is required" },
        { status: 400 },
      );
    }

    const searchTerm = search.trim();
    const searchTermUpper = searchTerm.toUpperCase();

    // Search for client, employee, item, supplier, project
    // for client get id, type, name
    // for employee get employee_id, image, first_name, last_name, role
    // for item get id, category, image, quantity, measurement_unit, brand, color, finish, type, name, sub_category,
    // for supplier get id, name
    // for project get project_id, name, number of lots,

    // Search clients
    const clients = await prisma.client.findMany({
      where: {
        organization_id: user.organizationId,
        is_deleted: false,
        OR: [
          { name: { contains: searchTerm } },
          { type: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        type: true,
        name: true,
      },
    });

    // Search employees
    const employees = await prisma.employees.findMany({
      where: {
        organization_id: user.organizationId,
        is_deleted: false,
        is_active: true,
        OR: [
          { first_name: { contains: searchTerm } },
          { last_name: { contains: searchTerm } },
          { role: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        employee_id: true,
        first_name: true,
        last_name: true,
        role: true,
        image: {
          select: {
            url: true,
          },
        },
      },
    });

    // Search suppliers
    const suppliers = await prisma.supplier.findMany({
      where: {
        organization_id: user.organizationId,
        is_deleted: false,
        name: { contains: searchTerm },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Search projects
    const projects = await prisma.project.findMany({
      where: {
        organization_id: user.organizationId,
        is_deleted: false,
        name: { contains: searchTerm },
      },
      select: {
        id: true,
        project_id: true,
        name: true,
        lots: {
          where: {
            is_deleted: false,
          },
          select: {
            id: true,
            lot_id: true,
          },
        },
      },
    });

    // Search items - handle enums separately to avoid invalid Prisma filters
    const categoryMatch = Object.values(Category).find(
      (c) => c === searchTermUpper,
    ) as Category | undefined;

    const itemSearchOR: Array<Record<string, unknown>> = [
      { measurement_unit: { contains: searchTerm } },
      { description: { contains: searchTerm } },
      {
        sheet: {
          OR: [
            { brand: { contains: searchTerm } },
            { color: { contains: searchTerm } },
            { finish: { contains: searchTerm } },
          ],
        },
      },
      {
        handle: {
          OR: [
            { brand: { contains: searchTerm } },
            { color: { contains: searchTerm } },
            { type: { contains: searchTerm } },
          ],
        },
      },
      {
        hardware: {
          OR: [
            { brand: { contains: searchTerm } },
            { name: { contains: searchTerm } },
            { type: { contains: searchTerm } },
            { sub_category: { contains: searchTerm } },
          ],
        },
      },
      {
        accessory: {
          name: { contains: searchTerm },
        },
      },
      {
        edging_tape: {
          OR: [
            { brand: { contains: searchTerm } },
            { color: { contains: searchTerm } },
            { finish: { contains: searchTerm } },
          ],
        },
      },
    ];

    if (categoryMatch) {
      itemSearchOR.push({ category: categoryMatch });
    }

    const items = await prisma.item.findMany({
      where: {
        organization_id: user.organizationId,
        is_deleted: false,
        OR: itemSearchOR,
      },
      select: {
        id: true,
        category: true,
        quantity: true,
        measurement_unit: true,
        image: {
          select: {
            url: true,
          },
        },
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
            type: true,
            name: true,
            sub_category: true,
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
      },
    });

    // Transform the results to match the requested format
    const transformedClients = clients.map((client) => ({
      client_id: client.id,
      client_type: client.type,
      client_name: client.name,
    }));

    const transformedEmployees = employees.map((employee) => ({
      employee_id: employee.employee_id,
      image: employee.image?.url || null,
      first_name: employee.first_name,
      last_name: employee.last_name,
      role: employee.role,
    }));

    const transformedSuppliers = suppliers.map((supplier) => ({
      supplier_id: supplier.id,
      supplier_name: supplier.name,
    }));

    const transformedProjects = projects.map((project) => ({
      project_id: project.id,
      project_name: project.name,
      number_of_lots: project.lots.length,
    }));

    const transformedItems = items.map((item) => {
      const result = {
        item_id: item.id,
        category: item.category,
        image: item.image?.url || null,
        quantity: item.quantity,
        measurement_unit: item.measurement_unit,
        brand: null as string | null,
        color: null as string | null,
        finish: null as string | null,
        type: null as string | null,
        name: null as string | null,
        sub_category: null as string | null,
      };

      // Extract fields based on category
      if (item.sheet) {
        result.brand = item.sheet.brand;
        result.color = item.sheet.color;
        result.finish = item.sheet.finish;
      } else if (item.handle) {
        result.brand = item.handle.brand;
        result.color = item.handle.color;
        result.type = item.handle.type;
      } else if (item.hardware) {
        result.brand = item.hardware.brand;
        result.type = item.hardware.type;
        result.name = item.hardware.name;
        result.sub_category = item.hardware.sub_category;
      } else if (item.accessory) {
        result.name = item.accessory.name;
      } else if (item.edging_tape) {
        result.brand = item.edging_tape.brand;
        result.color = item.edging_tape.color;
        result.finish = item.edging_tape.finish;
      }

      return result;
    });

    return NextResponse.json({
      status: true,
      data: {
        clients: transformedClients,
        employees: transformedEmployees,
        items: transformedItems,
        suppliers: transformedSuppliers,
        projects: transformedProjects,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { status: false, message: error.message },
        { status: error.statusCode },
      );
    }
    console.error("Error in POST /api/search:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
