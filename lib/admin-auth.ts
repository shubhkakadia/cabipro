import jwt, { SignOptions } from "jsonwebtoken";
import { hashPassword, verifyPassword } from "./auth";
import { prisma } from "./db";
import { SESSION_TTL_DAYS, getSessionExpiryDate } from "./cookies";

/**
 * JWT Payload structure for admin users
 * Note: No organizationId - admins can access all organizations
 */
export interface AdminJWTPayload {
  adminId: string;
  email: string;
  role: string;
}

/**
 * Result type for authenticateAdmin function
 */
export interface AdminAuthResult {
  token: string;
  expiresAt: Date;
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    image: string | null;
  };
}

/**
 * Create a JWT token containing admin information after successful login.
 * Instead of checking the database on every request, the token proves "this admin is authenticated."
 * Admin tokens don't include organizationId since admins can access all organizations.
 *
 * @param payload - Admin information to encode in the token
 * @returns Promise resolving to the JWT token string
 */
export const generateAdminToken = async (
  payload: AdminJWTPayload,
): Promise<string> => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  // Admin tokens expire based on SESSION_TTL_DAYS (adjust via environment variable or lib/cookies.ts)
  // Could be shorter for higher security (e.g., "1d" or "24h")
  const expiresIn = process.env.ADMIN_JWT_EXPIRES_IN || `${SESSION_TTL_DAYS}d`;

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  } as SignOptions);
};

/**
 * Validate and decode an admin JWT token to extract admin information.
 * On every protected admin request, verify the token is valid, not expired, and not tampered with.
 *
 * @param token - JWT token string to verify
 * @returns Promise resolving to the decoded payload, or null if invalid
 */
export const verifyAdminToken = async (
  token: string,
): Promise<AdminJWTPayload | null> => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  try {
    const decoded = jwt.verify(token, secret) as AdminJWTPayload;
    return decoded;
  } catch {
    // Token is invalid, expired, or tampered with
    return null;
  }
};

/**
 * Complete admin login flow - verify credentials and return token + admin data.
 * Combines all the above into one convenient function for admin login endpoints.
 *
 * Key differences from user auth:
 * - No organization context needed (admins can see all organizations)
 * - Uses Admin table instead of users table
 * - Different JWT payload (no organizationId)
 * - Higher security considerations (stricter rules, 2FA ready for future)
 *
 * @param email - Admin's email address
 * @param password - Plain text password
 * @returns Promise resolving to token and admin data, or null if authentication fails
 */
export const authenticateAdmin = async (
  email: string,
  password: string,
): Promise<AdminAuthResult | null> => {
  try {
    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        first_name: true,
        last_name: true,
        role: true,
        image: true,
        is_active: true,
        is_deleted: true,
      },
    });

    if (!admin) {
      return null; // Admin not found
    }

    // Check if admin account is active and not deleted
    if (!admin.is_active || admin.is_deleted) {
      return null; // Admin account is inactive or deleted
    }

    // Verify password
    const passwordValid = await verifyPassword(password, admin.password);
    if (!passwordValid) {
      return null; // Invalid password
    }

    // Generate admin JWT token
    const tokenPayload: AdminJWTPayload = {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    };

    const token = await generateAdminToken(tokenPayload);

    // Create admin session in database
    const expiresAt = getSessionExpiryDate();

    await prisma.admin_sessions.create({
      data: {
        admin_id: admin.id,
        token: token,
        admin_type: admin.role, // Store role as admin_type
        expires_at: expiresAt,
      },
    });

    // Return token and admin data (excluding password)
    return {
      token,
      expiresAt,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
        role: admin.role,
        image: admin.image,
      },
    };
  } catch (error) {
    // Log error for debugging (in production, use proper logging)
    console.error("Admin authentication error:", error);
    return null;
  }
};

// Re-export password utilities for convenience
export { hashPassword, verifyPassword };
