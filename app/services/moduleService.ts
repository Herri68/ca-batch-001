import { eq, and, sql, gt, lt, gte, lte, ne } from "drizzle-orm";
import { db } from "~/db";
import { modules, lessons } from "~/db/schema";

// ─── Module Service ───
// Handles module CRUD and reordering within courses.
// Uses positional parameters (project convention).

export function getModuleById(id: number) {
  return db.select().from(modules).where(eq(modules.id, id)).limit(1).then(r => r[0]);
}

export function getModulesByCourse(courseId: number) {
  return db
    .select()
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(modules.position)

}

export async function getModuleWithLessons(id: number) {
  const mod = await getModuleById(id);
  if (!mod) return null;

  const moduleLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.moduleId, id))
    .orderBy(lessons.position)

  return { ...mod, lessons: moduleLessons };
}

export async function createModule(
  courseId: number,
  title: string,
  position: number | null
) {
  const pos =
    position ??
    ((await db
      .select({ max: sql<number>`coalesce(max(${modules.position}), 0)` })
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .limit(1).then(r => r[0]))!.max + 1);

  return db
    .insert(modules)
    .values({ courseId, title, position: pos })
    .returning().then(r => r[0]);
}

export function updateModuleTitle(id: number, title: string) {
  return db
    .update(modules)
    .set({ title })
    .where(eq(modules.id, id))
    .returning().then(r => r[0]);
}

export async function deleteModule(id: number) {
  // Delete all lessons in this module first
  await db.delete(lessons).where(eq(lessons.moduleId, id));
  return db.delete(modules).where(eq(modules.id, id)).returning();
}

export async function getModuleCount(courseId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .limit(1).then(r => r[0]);
  return result?.count ?? 0;
}

// ─── Reordering ───

export async function moveModuleToPosition(moduleId: number, newPosition: number) {
  const mod = await getModuleById(moduleId);
  if (!mod) return null;

  const oldPosition = mod.position;
  if (oldPosition === newPosition) return mod;

  if (newPosition > oldPosition) {
    // Moving down: shift items between old+1 and new up by 1
    await db.update(modules)
      .set({ position: sql`${modules.position} - 1` })
      .where(
        and(
          eq(modules.courseId, mod.courseId),
          gt(modules.position, oldPosition),
          lte(modules.position, newPosition)
        )
      )

  } else {
    // Moving up: shift items between new and old-1 down by 1
    await db.update(modules)
      .set({ position: sql`${modules.position} + 1` })
      .where(
        and(
          eq(modules.courseId, mod.courseId),
          gte(modules.position, newPosition),
          lt(modules.position, oldPosition)
        )
      )

  }

  return db
    .update(modules)
    .set({ position: newPosition })
    .where(eq(modules.id, moduleId))
    .returning().then(r => r[0]);
}

export async function swapModulePositions(moduleIdA: number, moduleIdB: number) {
  const modA = await getModuleById(moduleIdA);
  const modB = await getModuleById(moduleIdB);
  if (!modA || !modB) return null;

  await db.update(modules)
    .set({ position: modB.position })
    .where(eq(modules.id, moduleIdA))

  await db.update(modules)
    .set({ position: modA.position })
    .where(eq(modules.id, moduleIdB))

  return {
    a: { ...modA, position: modB.position },
    b: { ...modB, position: modA.position },
  };
}

export async function reorderModules(courseId: number, moduleIds: number[]) {
  for (let i = 0; i < moduleIds.length; i++) {
    await db.update(modules)
      .set({ position: i + 1 })
      .where(and(eq(modules.id, moduleIds[i]), eq(modules.courseId, courseId)))

  }
  return getModulesByCourse(courseId);
}
