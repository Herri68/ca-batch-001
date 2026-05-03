import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import * as schema from "~/db/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, "../../drizzle");

/**
 * Creates a test database client connected to the DATABASE_URL.
 * Each test suite should use a separate schema or clean up after itself.
 */
export async function createTestDb() {
  const client = postgres(process.env.DATABASE_URL!);
  const testDb = drizzle(client, { schema });

  await migrate(testDb, { migrationsFolder });

  return testDb;
}

/**
 * Seeds a minimal set of base data (user, category, course) that most tests need.
 * Returns the created IDs for use in test assertions.
 */
export async function seedBaseData(testDb: Awaited<ReturnType<typeof createTestDb>>) {
  const [user] = await testDb
    .insert(schema.users)
    .values({
      name: "Test User",
      email: "test@example.com",
      role: schema.UserRole.Student,
    })
    .returning();

  const [instructor] = await testDb
    .insert(schema.users)
    .values({
      name: "Test Instructor",
      email: "instructor@example.com",
      role: schema.UserRole.Instructor,
    })
    .returning();

  const [category] = await testDb
    .insert(schema.categories)
    .values({ name: "Programming", slug: "programming" })
    .returning();

  const [course] = await testDb
    .insert(schema.courses)
    .values({
      title: "Test Course",
      slug: "test-course",
      description: "A test course",
      instructorId: instructor.id,
      categoryId: category.id,
      status: schema.CourseStatus.Published,
    })
    .returning();

  return { user, instructor, category, course };
}
