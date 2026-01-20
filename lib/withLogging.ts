import { NextRequest } from "next/server";
import { prisma } from "./db";
import { requireAuth } from "./auth-middleware";
import type { JWTPayload } from "./auth";
import type { LogAction } from "@/generated/prisma/enums";

/**
 * Logs an action to the database
 *
 * @param request - Next.js request object
 * @param entityType - Type of entity being logged (e.g., "client", "project")
 * @param entityId - ID of the entity being logged
 * @param action - Action being performed (CREATE, UPDATE, DELETE, etc.)
 * @param description - Optional description of the action
 * @returns Promise resolving to true if logging succeeded, false otherwise
 */
export async function withLogging(
  request: NextRequest,
  entityType: string,
  entityId: string,
  action: LogAction,
  description?: string,
): Promise<boolean> {
  try {
    let userPayload: JWTPayload | null = null;
    let userId: string | null = null;
    let organizationId: string | null = null;

    try {
      userPayload = await requireAuth(request);
      if (userPayload) {
        organizationId = userPayload.organizationId;
        userId = userPayload.userId;
      }
    } catch {
      // No valid authentication
      console.error("withLogging: No valid authentication found");
      return false;
    }

    if (!organizationId) {
      console.error("withLogging: Could not determine organization_id");
      return false;
    }

    // Create the log entry
    await prisma.logs.create({
      data: {
        organization_id: organizationId,
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        action: action,
        description: description || null,
      },
    });

    return true;
  } catch (error) {
    console.error("withLogging: Error creating log:", error);
    return false;
  }
}
