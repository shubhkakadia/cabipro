import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

// Parse DATABASE_URL or use individual connection parameters
const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    // Parse DATABASE_URL format: mysql://user:password@host:port/database
    try {
      const url = new URL(databaseUrl);
      return {
        host: url.hostname || "localhost",
        port: parseInt(url.port) || 3306,
        user: url.username || "root",
        password: url.password || "",
        database: url.pathname?.slice(1) || undefined, // Remove leading '/'
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "5"),
      };
    } catch (error) {
      console.error("Error parsing DATABASE_URL:", error);
    }
  }

  // Fallback to individual environment variables
  return {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "3306"),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "5"),
  };
};

const dbConfig = getDatabaseConfig();

const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: dbConfig.connectionLimit,
});

export const prisma = new PrismaClient({ adapter });
