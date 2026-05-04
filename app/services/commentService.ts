import { eq } from "drizzle-orm";
import { db } from "~/db";
import { lessonComments, users } from "~/db/schema";

export async function addComment(userId: number, lessonId: number, content: string) {
  return db.insert(lessonComments).values({ userId, lessonId, content });
}

export async function getCommentsForLesson(lessonId: number) {
  return db
    .select({
      id: lessonComments.id,
      content: lessonComments.content,
      createdAt: lessonComments.createdAt,
      userId: lessonComments.userId,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
      userRole: users.role,
    })
    .from(lessonComments)
    .innerJoin(users, eq(lessonComments.userId, users.id))
    .where(eq(lessonComments.lessonId, lessonId))
    .orderBy(lessonComments.createdAt);
}

export async function getCommentById(commentId: number) {
  return db
    .select()
    .from(lessonComments)
    .where(eq(lessonComments.id, commentId))
    .then((r) => r[0] ?? null);
}

export async function deleteComment(commentId: number) {
  return db.delete(lessonComments).where(eq(lessonComments.id, commentId));
}
