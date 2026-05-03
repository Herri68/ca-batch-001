import { eq, and, avg, count, inArray, sql } from "drizzle-orm";
import { db } from "~/db";
import { courseRatings } from "~/db/schema";

export async function upsertRating(userId: number, courseId: number, rating: number) {
  const existing = await db
    .select()
    .from(courseRatings)
    .where(and(eq(courseRatings.userId, userId), eq(courseRatings.courseId, courseId)))
    .then((r) => r[0]);

  if (existing) {
    await db
      .update(courseRatings)
      .set({ rating, updatedAt: new Date().toISOString() })
      .where(eq(courseRatings.id, existing.id));
  } else {
    await db.insert(courseRatings).values({ userId, courseId, rating });
  }
}

export async function getUserRatingForCourse(userId: number, courseId: number) {
  return db
    .select()
    .from(courseRatings)
    .where(and(eq(courseRatings.userId, userId), eq(courseRatings.courseId, courseId)))
    .then((r) => r[0]?.rating ?? null);
}

export async function getAverageRatingForCourse(
  courseId: number
): Promise<{ average: number | null; count: number }> {
  const result = await db
    .select({
      average: avg(courseRatings.rating),
      count: count(courseRatings.id),
    })
    .from(courseRatings)
    .where(eq(courseRatings.courseId, courseId))
    .then((r) => r[0]);

  return {
    average: result.average ? parseFloat(result.average) : null,
    count: result.count,
  };
}

export async function getAverageRatingsForCourses(
  courseIds: number[]
): Promise<Map<number, { average: number | null; count: number }>> {
  const map = new Map<number, { average: number | null; count: number }>();
  if (courseIds.length === 0) return map;

  const results = await db
    .select({
      courseId: courseRatings.courseId,
      average: avg(courseRatings.rating),
      count: count(courseRatings.id),
    })
    .from(courseRatings)
    .where(inArray(courseRatings.courseId, courseIds))
    .groupBy(courseRatings.courseId);

  for (const row of results) {
    map.set(row.courseId, {
      average: row.average ? parseFloat(row.average) : null,
      count: row.count,
    });
  }

  return map;
}
