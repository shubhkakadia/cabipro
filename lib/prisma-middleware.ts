import { PrismaClient } from "../generated/prisma/client";
import { AsyncLocalStorage } from "async_hooks";
import { prisma } from "./db";

/**
 * AsyncLocalStorage to store organization context per request
 * This allows us to access the organization_id from anywhere in the request lifecycle
 */
export const organizationContext = new AsyncLocalStorage<string>();

/**
 * Get the current organization ID from context
 * Returns null if no organization context is set
 */
export function getOrganizationId(): string | null {
  return organizationContext.getStore() ?? null;
}

/**
 * Set the organization ID in the current context
 * This should be called at the start of each request
 */
export function setOrganizationId(organizationId: string): void {
  organizationContext.enterWith(organizationId);
}

/**
 * Run a function with a specific organization context
 * Useful for wrapping API routes or server actions
 */
export async function withOrganizationContext<T>(
  organizationId: string,
  fn: () => Promise<T>,
): Promise<T> {
  return organizationContext.run(organizationId, fn);
}

/**
 * List of models that have organization_id field and should be filtered
 * Based on your Prisma schema
 */
const ORGANIZATION_SCOPED_MODELS = [
  "organization",
  "constants_config",
  "contact",
  "employees",
  "item",
  "logs",
  "lot",
  "lot_file",
  "lot_tab",
  "material_selection",
  "materials_to_order",
  "media",
  "module_access",
  "project",
  "purchase_order",
  "quote",
  "sessions",
  "stage",
  "supplier",
  "supplier_file",
  "users",
] as const;

type OrganizationScopedModel = (typeof ORGANIZATION_SCOPED_MODELS)[number];

/**
 * Check if a model should be filtered by organization_id
 */
function shouldFilterModel(model: string): model is OrganizationScopedModel {
  return ORGANIZATION_SCOPED_MODELS.includes(model as OrganizationScopedModel);
}

/**
 * Type for Prisma middleware params
 */
type PrismaMiddlewareParams = {
  model?: string;
  action: string;
  args: Record<string, unknown>;
  dataPath: string[];
  runInTransaction: boolean;
};

/**
 * Type for Prisma middleware next function
 */
type PrismaMiddlewareNext = (
  params: PrismaMiddlewareParams,
) => Promise<unknown>;

/**
 * Recursively add organization_id filter to query arguments
 */
function addOrganizationFilter(
  args: Record<string, unknown> | undefined | null,
  organizationId: string,
): Record<string, unknown> {
  if (!args) {
    return { organization_id: organizationId };
  }

  // If args is already an object, merge organization_id
  if (typeof args === "object" && !Array.isArray(args)) {
    // Handle where clause
    if (args.where && typeof args.where === "object") {
      return {
        ...args,
        where: {
          ...(args.where as Record<string, unknown>),
          organization_id: organizationId,
        },
      };
    }

    // Handle direct organization_id in args (for create, update, etc.)
    if (!args.organization_id) {
      return {
        ...args,
        organization_id: organizationId,
      };
    }

    // Recursively process nested objects
    const processed: Record<string, unknown> = { ...args };
    for (const key in processed) {
      if (
        typeof processed[key] === "object" &&
        processed[key] !== null &&
        !Array.isArray(processed[key])
      ) {
        processed[key] = addOrganizationFilter(
          processed[key] as Record<string, unknown>,
          organizationId,
        );
      }
    }
    return processed;
  }

  return args;
}

/**
 * Create Prisma middleware that automatically filters queries by organization_id
 *
 * Usage:
 * ```ts
 * import { PrismaClient } from "../generated/prisma";
 * import { setupOrganizationMiddleware } from "./lib/prisma-middleware";
 *
 * const prisma = new PrismaClient();
 * setupOrganizationMiddleware(prisma);
 * ```
 */
export function setupOrganizationMiddleware(prisma: PrismaClient): void {
  // Prisma middleware API - $use is available at runtime but may not be in types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaWithMiddleware = prisma as any;
  if (typeof prismaWithMiddleware.$use === "function") {
    prismaWithMiddleware.$use(
      async (params: PrismaMiddlewareParams, next: PrismaMiddlewareNext) => {
        const organizationId = getOrganizationId();

        // If no organization context is set, skip filtering
        // This allows admin queries or system-level operations
        if (!organizationId) {
          return next(params);
        }

        // Only filter models that have organization_id
        if (!params.model || !shouldFilterModel(params.model)) {
          return next(params);
        }

        // Handle different operation types
        switch (params.action) {
          case "findMany":
          case "findFirst":
          case "findUnique":
          case "count":
          case "aggregate":
          case "groupBy":
            // Add organization_id to where clause
            params.args = addOrganizationFilter(
              params.args as Record<string, unknown>,
              organizationId,
            ) as Record<string, unknown>;
            break;

          case "create":
          case "createMany":
            // Ensure organization_id is set on create
            params.args = addOrganizationFilter(
              params.args as Record<string, unknown>,
              organizationId,
            ) as Record<string, unknown>;
            break;

          case "update":
          case "updateMany":
            // Filter by organization_id in where clause and ensure it's not changed
            params.args = addOrganizationFilter(
              params.args as Record<string, unknown>,
              organizationId,
            ) as Record<string, unknown>;
            // Prevent changing organization_id
            const updateArgs = params.args as {
              data?: Record<string, unknown>;
            };
            if (updateArgs.data && updateArgs.data.organization_id) {
              delete updateArgs.data.organization_id;
            }
            break;

          case "upsert":
            // Filter by organization_id in where clause
            params.args = addOrganizationFilter(
              params.args as Record<string, unknown>,
              organizationId,
            ) as Record<string, unknown>;
            // Ensure organization_id is set in create/update data
            const upsertArgs = params.args as {
              create?: Record<string, unknown>;
              update?: Record<string, unknown>;
            };
            if (upsertArgs.create) {
              upsertArgs.create = addOrganizationFilter(
                upsertArgs.create,
                organizationId,
              );
            }
            if (upsertArgs.update) {
              upsertArgs.update = addOrganizationFilter(
                upsertArgs.update,
                organizationId,
              );
              // Prevent changing organization_id
              if (upsertArgs.update.organization_id) {
                delete upsertArgs.update.organization_id;
              }
            }
            break;

          case "delete":
          case "deleteMany":
            // Filter by organization_id in where clause
            params.args = addOrganizationFilter(
              params.args as Record<string, unknown>,
              organizationId,
            ) as Record<string, unknown>;
            break;

          default:
            // For other operations, try to add filter if args exist
            params.args = addOrganizationFilter(
              params.args as Record<string, unknown>,
              organizationId,
            ) as Record<string, unknown>;
            break;
        }

        return next(params);
      },
    );
  }
}

/**
 * Helper function to create a Prisma client with organization middleware already set up
 *
 * Usage:
 * ```ts
 * import { createPrismaClient } from "./lib/prisma-middleware";
 *
 * const prisma = createPrismaClient();
 * ```
 */
export function createPrismaClient(): PrismaClient {
  setupOrganizationMiddleware(prisma);
  return prisma;
}
