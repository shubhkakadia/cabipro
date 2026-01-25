import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { prisma } from "@/lib/db";
import type {
  LotStatus,
  MTOStatus,
  PurchaseOrderStatus,
  StageStatus,
} from "@/generated/prisma/enums";

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Helper function to convert month name/number to two-digit format
function normalizeMonth(
  month: string | number | null | undefined,
): string | null {
  if (!month || month.toString().toLowerCase() === "all") return null;

  const monthMap = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };

  const monthLower = month.toString().toLowerCase().trim();

  // Check if it's a month name
  if (monthLower in monthMap) {
    return monthMap[monthLower as keyof typeof monthMap];
  }

  // Check if it's a number
  const monthNum = parseInt(month.toString(), 10);
  if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
    return monthNum.toString().padStart(2, "0");
  }

  // If it's already in two-digit format (e.g., "01", "11")
  const monthStr = month.toString();
  if (
    /^\d{2}$/.test(monthStr) &&
    parseInt(monthStr, 10) >= 1 &&
    parseInt(monthStr, 10) <= 12
  ) {
    return monthStr;
  }

  return null;
}

// Helper function to build month_year filter array
function buildMonthYearFilter(
  year: string | number | null | undefined,
  month: string | number | null | undefined,
): string[] | null {
  const normalizedMonth = normalizeMonth(month);
  const isYearAll = !year || year.toString().toLowerCase() === "all";
  const isMonthAll = !normalizedMonth;

  // If both are "all", return empty array (no filter)
  if (isYearAll && isMonthAll) {
    return [];
  }

  // If year is "all" but month is specific, we need to get all years with that month
  // This requires a different query approach - we'll handle it separately
  if (isYearAll && !isMonthAll) {
    return null; // Special case - use endsWith
  }

  // If year is specific and month is "all", get all 12 months for that year
  if (!isYearAll && isMonthAll) {
    return [
      `${year}-01`,
      `${year}-02`,
      `${year}-03`,
      `${year}-04`,
      `${year}-05`,
      `${year}-06`,
      `${year}-07`,
      `${year}-08`,
      `${year}-09`,
      `${year}-10`,
      `${year}-11`,
      `${year}-12`,
    ];
  }

  // If both are specific, return single month-year combination
  if (!isYearAll && !isMonthAll) {
    return [`${year}-${normalizedMonth}`];
  }

  return [];
}

function adelaideLocalToUTC(dateString: string): Date {
  const adelaideDate = dayjs.tz(`${dateString}T00:00:00`, "Australia/Adelaide");
  return adelaideDate.utc().toDate();
}

// Helper function to build date range filter for DateTime fields
function buildDateRangeFilter(
  year: string | number | null | undefined,
  month: string | number | null | undefined,
): { gte: Date; lt: Date } | Record<string, never> | null {
  const isYearAll = !year || year.toString().toLowerCase() === "all";
  const normalizedMonth = normalizeMonth(month);
  const isMonthAll = !normalizedMonth;

  // If both are "all", return empty object (no filter)
  if (isYearAll && isMonthAll) {
    return {};
  }

  if (isYearAll && !isMonthAll) {
    return null;
  }

  if (!isYearAll && isMonthAll) {
    const yearStr = year.toString();
    return {
      gte: adelaideLocalToUTC(`${yearStr}-01-01`),
      lt: adelaideLocalToUTC(`${parseInt(yearStr) + 1}-01-01`),
    };
  }

  if (!isYearAll && !isMonthAll) {
    const yearStr = year.toString();
    const monthNum = parseInt(normalizedMonth, 10);
    const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
    const nextYear = monthNum === 12 ? parseInt(yearStr) + 1 : yearStr;
    return {
      gte: adelaideLocalToUTC(`${yearStr}-${normalizedMonth}-01`),
      lt: adelaideLocalToUTC(
        `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
      ),
    };
  }

  return {} as Record<string, never>;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Parse request body
    const body = await request.json();
    const { month, year } = body;

    // Build date range filter for DateTime fields
    const dateRangeFilter = buildDateRangeFilter(year, month);

    const dashboardData = {
      activeProjects: 0,
      activeLots: 0,
      activeMTOs: 0,
      activePurchaseOrders: 0,
      totalSpent: 0,
      lotsByStage: {},
      MTOsByStatus: {},
      purchaseOrdersByStatus: {},
      top10items: {},
      top10itemsCount: {},
      topstagesDue: {},
      projectsCompletedThisMonth: 0,
      averageProjectDuration: 0,
      upcomingMeetings: [] as any[],
      recentLogs: [] as any[],
    };

    // Build all where clauses first (no database calls yet)
    const activeProjectsWhere = {
      organization_id: user.organizationId,
      is_deleted: false,
      lots: {
        some: {
          status: "ACTIVE" as LotStatus,
          ...(dateRangeFilter &&
            Object.keys(dateRangeFilter).length > 0 && {
              OR: [
                { startDate: dateRangeFilter },
                { createdAt: dateRangeFilter },
              ],
            }),
        },
      },
    };

    const activeLotsWhere = {
      organization_id: user.organizationId,
      status: "ACTIVE" as LotStatus,
      ...(dateRangeFilter &&
        Object.keys(dateRangeFilter).length > 0 && {
          OR: [{ startDate: dateRangeFilter }, { createdAt: dateRangeFilter }],
        }),
    };

    const activeMTOsWhere = {
      organization_id: user.organizationId,
      status: {
        in: ["DRAFT", "PARTIALLY_ORDERED"] as MTOStatus[],
      },
      ...(dateRangeFilter &&
        Object.keys(dateRangeFilter).length > 0 && {
          createdAt: dateRangeFilter,
        }),
    };

    const activePurchaseOrdersWhere = {
      organization_id: user.organizationId,
      status: {
        in: ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED"] as PurchaseOrderStatus[],
      },
      ...(dateRangeFilter &&
        Object.keys(dateRangeFilter).length > 0 && {
          OR: [{ createdAt: dateRangeFilter }, { ordered_at: dateRangeFilter }],
        }),
    };

    // Filter supplier statements based on month and year
    const monthYearFilter = buildMonthYearFilter(year, month);
    const isYearAll = !year || year.toString().toLowerCase() === "all";
    const normalizedMonth = normalizeMonth(month);
    const isMonthAll = !normalizedMonth;

    interface TotalSpentWhere {
      supplier: {
        organization_id: string;
      };
      month_year?: {
        endsWith?: string;
        in?: string[];
      };
    }

    let totalSpentWhere: TotalSpentWhere = {
      supplier: {
        organization_id: user.organizationId,
      },
    };

    // Special case: year is "all" but month is specific
    if (isYearAll && !isMonthAll) {
      // Use endsWith to match all years with the specific month
      totalSpentWhere = {
        ...totalSpentWhere,
        month_year: {
          endsWith: `-${normalizedMonth}`,
        },
      };
    } else if (monthYearFilter && monthYearFilter.length > 0) {
      // Use "in" operator for specific month-year combinations
      totalSpentWhere = {
        ...totalSpentWhere,
        month_year: {
          in: monthYearFilter,
        },
      };
    }
    // If both are "all", totalSpentWhere keeps organization filter

    const lotsByStageWhere = {
      organizationId: user.organizationId,
      lot: {
        status: "ACTIVE" as LotStatus,
        organization_id: user.organizationId,
      },
      ...(dateRangeFilter &&
        Object.keys(dateRangeFilter).length > 0 && {
          OR: [{ startDate: dateRangeFilter }, { endDate: dateRangeFilter }],
        }),
    };

    const mtosByStatusWhere = {
      organization_id: user.organizationId,
      ...(dateRangeFilter &&
        Object.keys(dateRangeFilter).length > 0 && {
          createdAt: dateRangeFilter,
        }),
    };

    const posByStatusWhere = {
      organization_id: user.organizationId,
      ...(dateRangeFilter &&
        Object.keys(dateRangeFilter).length > 0 && {
          OR: [{ createdAt: dateRangeFilter }, { ordered_at: dateRangeFilter }],
        }),
    };

    const stockTransactionsWhere = {
      item: {
        organization_id: user.organizationId,
      },
      ...(dateRangeFilter &&
        Object.keys(dateRangeFilter).length > 0 && {
          createdAt: dateRangeFilter,
        }),
    };

    const topstagesDueWhere = {
      organizationId: user.organizationId,
      status: "IN_PROGRESS" as StageStatus,
      lot: {
        status: "ACTIVE" as LotStatus,
        organization_id: user.organizationId,
      },
      ...(dateRangeFilter &&
        Object.keys(dateRangeFilter).length > 0 && {
          endDate: dateRangeFilter,
        }),
    };

    // Projects Completed This Month - projects with at least one completed lot this month
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date();
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
    currentMonthEnd.setDate(0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    const projectsCompletedThisMonthWhere = {
      organization_id: user.organizationId,
      is_deleted: false,
      lots: {
        some: {
          status: "COMPLETED" as LotStatus,
          updatedAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
      },
    };

    // Average Project Duration - calculate average duration for completed projects
    // Duration = time from first lot startDate to last lot completion
    const completedProjectsWhere = {
      organization_id: user.organizationId,
      is_deleted: false,
      lots: {
        some: {
          status: "COMPLETED" as LotStatus,
        },
      },
    };

    // Execute all independent queries in parallel
    const [
      activeProjects,
      activeLots,
      activeMTOs,
      activePurchaseOrders,
      totalSpent,
      lotsByStage,
      MTOsByStatus,
      purchaseOrdersByStatus,
      allItemsCount,
      topstagesDue,
      projectsCompletedThisMonth,
      completedProjects,
      upcomingMeetings,
      recentLogs,
    ] = await Promise.all([
      prisma.project.count({ where: activeProjectsWhere }),
      prisma.lot.count({ where: activeLotsWhere }),
      prisma.materials_to_order.count({ where: activeMTOsWhere }),
      prisma.purchase_order.count({ where: activePurchaseOrdersWhere }),
      prisma.supplier_statement.findMany({
        where: totalSpentWhere,
        select: {
          month_year: true,
          supplier: {
            select: {
              name: true,
            },
          },
          amount: true,
        },
      }),
      prisma.stage.groupBy({
        by: ["name"],
        where: lotsByStageWhere,
        _count: true,
      }),
      prisma.materials_to_order.groupBy({
        by: ["status"],
        where: mtosByStatusWhere,
        _count: true,
      }),
      prisma.purchase_order.groupBy({
        by: ["status"],
        where: posByStatusWhere,
        _count: true,
      }),
      prisma.stock_transaction.groupBy({
        by: ["item_id"],
        where: stockTransactionsWhere,
        _count: true,
      }),
      prisma.stage.findMany({
        where: topstagesDueWhere,
        include: {
          lot: {
            include: {
              project: {
                select: {
                  name: true,
                  project_id: true,
                },
              },
            },
          },
        },
        orderBy: {
          endDate: "asc",
        },
      }),
      prisma.project.count({ where: projectsCompletedThisMonthWhere }),
      prisma.project.findMany({
        where: completedProjectsWhere,
        include: {
          lots: {
            where: {
              status: "COMPLETED",
            },
            select: {
              startDate: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.meeting.findMany({
        where: {
          date_time: {
            gte: new Date(),
          },
          participants: {
            some: {
              id: user.userId,
            },
          },
        },
        orderBy: {
          date_time: "asc",
        },
        take: 5,
        include: {
          participants: {
            select: {
              id: true,
              email: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  image: true,
                },
              },
            },
          },
          lots: {
            select: {
              lot_id: true,
              project: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.logs.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              email: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  image: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Calculate total spent from supplier statements
    interface SupplierStatement {
      amount: { toString(): string } | null;
    }
    const totalSpentAmount = totalSpent.reduce(
      (sum: number, statement: SupplierStatement) => {
        return (
          sum + (statement.amount ? Number(statement.amount.toString()) : 0)
        );
      },
      0,
    );

    // Assign results to dashboard data
    dashboardData.activeProjects = activeProjects;
    dashboardData.activeLots = activeLots;
    dashboardData.activeMTOs = activeMTOs;
    dashboardData.activePurchaseOrders = activePurchaseOrders;
    dashboardData.totalSpent = totalSpentAmount;
    dashboardData.lotsByStage = lotsByStage;
    dashboardData.MTOsByStatus = MTOsByStatus;
    dashboardData.purchaseOrdersByStatus = purchaseOrdersByStatus;
    dashboardData.topstagesDue = topstagesDue;
    dashboardData.projectsCompletedThisMonth = projectsCompletedThisMonth;
    dashboardData.upcomingMeetings = upcomingMeetings;
    dashboardData.recentLogs = recentLogs;

    // Calculate average project duration
    interface CompletedLot {
      startDate: Date | null;
      updatedAt: Date;
    }

    interface CompletedProject {
      lots: CompletedLot[];
    }

    if (completedProjects.length > 0) {
      const projectDurations = (completedProjects as CompletedProject[])
        .map((project) => {
          if (!project.lots || project.lots.length === 0) return null;

          const completedLots = project.lots.filter(
            (lot) => lot.startDate && lot.updatedAt,
          );
          if (completedLots.length === 0) return null;

          // Find earliest start date and latest completion date
          const startDates = completedLots
            .map((lot) => new Date(lot.startDate!))
            .filter((date) => !isNaN(date.getTime()));
          const completionDates = completedLots
            .map((lot) => new Date(lot.updatedAt))
            .filter((date) => !isNaN(date.getTime()));

          if (startDates.length === 0 || completionDates.length === 0)
            return null;

          const earliestStart = new Date(
            Math.min(...startDates.map((d) => d.getTime())),
          );
          const latestCompletion = new Date(
            Math.max(...completionDates.map((d) => d.getTime())),
          );
          const durationDays =
            (latestCompletion.getTime() - earliestStart.getTime()) /
            (1000 * 60 * 60 * 24);

          return durationDays > 0 ? durationDays : null;
        })
        .filter((duration): duration is number => duration !== null);

      if (projectDurations.length > 0) {
        const averageDuration =
          projectDurations.reduce((sum, duration) => sum + duration, 0) /
          projectDurations.length;
        dashboardData.averageProjectDuration = Math.round(averageDuration);
      } else {
        dashboardData.averageProjectDuration = 0;
      }
    } else {
      dashboardData.averageProjectDuration = 0;
    }

    // Process top 10 items (depends on allItemsCount)
    interface ItemCount {
      item_id: string;
      _count: number;
    }

    const top10itemsCount = (allItemsCount as ItemCount[])
      .sort((a, b) => b._count - a._count)
      .slice(0, 10);

    dashboardData.top10itemsCount = top10itemsCount;

    // Only fetch details for the top 10 items
    dashboardData.top10items =
      top10itemsCount.length > 0
        ? await prisma.item.findMany({
            where: {
              id: {
                in: top10itemsCount.map((item) => item.item_id),
              },
              organization_id: user.organizationId,
            },
            include: {
              image: true,
              sheet: true,
              handle: true,
              hardware: true,
              accessory: true,
              edging_tape: true,
            },
          })
        : [];

    return NextResponse.json(
      {
        status: true,
        message: "Dashboard fetched successfully",
        data: dashboardData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in POST /api/dashboard:", error);
    return NextResponse.json(
      { status: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
