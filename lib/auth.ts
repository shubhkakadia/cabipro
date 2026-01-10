import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "./db";
import { SESSION_TTL_DAYS, getSessionExpiryDate } from "./cookies";



/**
 * JWT Payload structure for organization users
 */
export interface JWTPayload {
  userId: string;
  organizationId: string;
  email: string;
  userType: string;
}

/**
 * Result type for authenticateUser function
 */
export interface AuthResult {
  token: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    organizationId: string;
  };
}

/**
 * Convert plain text passwords to secure hashes before storing in database.
 * Never store passwords as plain text! If your database is breached, hackers can't read the passwords.
 *
 * @param password - Plain text password to hash
 * @returns Promise resolving to the hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (!password || password.length === 0) {
    throw new Error("Password cannot be empty");
  }

  // Use bcrypt with 10 salt rounds (good balance between security and performance)
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Check if a plain text password matches the stored hash during login.
 * You can't "decrypt" a hash back to plain text. You must hash the input and compare hashes.
 *
 * @param password - Plain text password to verify
 * @param hashedPassword - Stored hash from database
 * @returns Promise resolving to true if password matches, false otherwise
 */
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  if (!password || !hashedPassword) {
    return false;
  }

  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Create a JWT token containing user information after successful login.
 * Instead of checking the database on every request, the token proves "this user is authenticated."
 *
 * @param payload - User information to encode in the token
 * @returns Promise resolving to the JWT token string
 */
export const generateToken = async (payload: JWTPayload): Promise<string> => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  // Token expires based on SESSION_TTL_DAYS (adjust via environment variable or lib/cookies.ts)
  const expiresIn = process.env.JWT_EXPIRES_IN || `${SESSION_TTL_DAYS}d`;

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  } as SignOptions);
};

/**
 * Validate and decode a JWT token to extract user information.
 * On every protected request, verify the token is valid, not expired, and not tampered with.
 *
 * @param token - JWT token string to verify
 * @returns Promise resolving to the decoded payload, or null if invalid
 */
export const verifyToken = async (
  token: string
): Promise<JWTPayload | null> => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch {
    // Token is invalid, expired, or tampered with
    return null;
  }
};

/**
 * Simplified login flow - verify credentials using email/password only.
 * Organization is retrieved from the user's record in the database.
 *
 * @param email - User's email address
 * @param password - Plain text password
 * @returns Promise resolving to token and user data, or null if authentication fails
 */
export const authenticateUser = async (
  email: string,
  password: string
): Promise<AuthResult | null> => {
  try {
    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        user_type: true,
        first_name: true,
        last_name: true,
        organization_id: true,
        is_active: true,
      },
    });

    if (!user) {
      return null; // User not found
    }

    // Check if user is active
    if (!user.is_active) {
      return null; // User account is inactive
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      return null; // Invalid password
    }

    // Get organization to verify it's active
    const organization = await prisma.organization.findUnique({
      where: { id: user.organization_id },
      select: {
        id: true,
        is_active: true,
        is_deleted: true,
      },
    });

    if (!organization) {
      return null; // Organization not found
    }

    if (!organization.is_active || organization.is_deleted) {
      return null; // Organization is inactive or deleted
    }

    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      organizationId: user.organization_id,
      email: user.email,
      userType: user.user_type,
    };

    const token = await generateToken(tokenPayload);
    // Create session in database
    const expiresAt = getSessionExpiryDate();

    await prisma.sessions.create({
      data: {
        user_id: user.id,
        organization_id: user.organization_id,
        token: token,
        user_type: user.user_type,
        expires_at: expiresAt,
      },
    });

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Return token and user data (excluding password)
    return {
      token,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        organizationId: user.organization_id,
      },
    };
  } catch (error) {
    // Log error for debugging (in production, use proper logging)
    console.error("Authentication error:", error);
    return null;
  }
};