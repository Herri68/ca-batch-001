import { eq, and, sql } from "drizzle-orm";
import { db } from "~/db";
import {
  enrollments,
  courses,
  modules,
  lessons,
  lessonProgress,
  LessonProgressStatus,
} from "~/db/schema";

// ─── Enrollment Service ───
// Handles enrollment, unenrollment, duplicate prevention, and enrollment validation.
// Uses positional parameters (project convention).

export function getEnrollmentById(id: number) {
  return db.select().from(enrollments).where(eq(enrollments.id, id)).limit(1).then(r => r[0]);
}

export function getEnrollmentsByUser(userId: number) {
  return db
    .select()
    .from(enrollments)
    .where(eq(enrollments.userId, userId))

}

export function getEnrollmentsByCourse(courseId: number) {
  return db
    .select()
    .from(enrollments)
    .where(eq(enrollments.courseId, courseId))

}

export async function getEnrollmentCountForCourse(courseId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .where(eq(enrollments.courseId, courseId))
    .limit(1).then(r => r[0]);

  return result?.count ?? 0;
}

export function findEnrollment(userId: number, courseId: number) {
  return db
    .select()
    .from(enrollments)
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
    )
    .limit(1).then(r => r[0]);
}

export async function isUserEnrolled(userId: number, courseId: number) {
  return !!(await findEnrollment(userId, courseId));
}

export async function enrollUser(
  userId: number,
  courseId: number,
  sendEmail: boolean,
  skipValidation: boolean
) {
  if (!skipValidation) {
    // Check if already enrolled
    const existing = await findEnrollment(userId, courseId);
    if (existing) {
      throw new Error("User is already enrolled in this course");
    }

    // Check that the course exists
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1).then(r => r[0]);
    if (!course) {
      throw new Error("Course not found");
    }
  }

  const enrollment = await db
    .insert(enrollments)
    .values({ userId, courseId })
    .returning().then(r => r[0]);

  // sendEmail parameter accepted but not implemented (no email service — PRD out of scope)
  if (sendEmail) {
    // Would send welcome email here
  }

  return enrollment;
}

export async function unenrollUser(userId: number, courseId: number) {
  const existing = await findEnrollment(userId, courseId);
  if (!existing) {
    throw new Error("User is not enrolled in this course");
  }

  return db
    .delete(enrollments)
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
    )
    .returning().then(r => r[0]);
}

export function markEnrollmentComplete(userId: number, courseId: number) {
  return db
    .update(enrollments)
    .set({ completedAt: new Date().toISOString() })
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
    )
    .returning().then(r => r[0]);
}

export function getUserEnrolledCourses(userId: number) {
  return db
    .select({
      enrollmentId: enrollments.id,
      courseId: enrollments.courseId,
      enrolledAt: enrollments.enrolledAt,
      completedAt: enrollments.completedAt,
      courseTitle: courses.title,
      courseSlug: courses.slug,
      courseDescription: courses.description,
      coverImageUrl: courses.coverImageUrl,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.userId, userId))

}

export function getCourseEnrolledStudents(courseId: number) {
  return db
    .select({
      enrollmentId: enrollments.id,
      userId: enrollments.userId,
      enrolledAt: enrollments.enrolledAt,
      completedAt: enrollments.completedAt,
    })
    .from(enrollments)
    .where(eq(enrollments.courseId, courseId))

}
