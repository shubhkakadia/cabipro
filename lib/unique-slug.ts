import { prisma } from "./db";
import { generateSlug } from "./slug-utils";

// Re-export generateSlug for backward compatibility
export { generateSlug };

/**
 * Generate a unique slug by appending a number if slug already exists
 */
export async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
