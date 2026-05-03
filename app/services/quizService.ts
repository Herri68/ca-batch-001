import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "~/db";
import {
  quizzes,
  quizQuestions,
  quizOptions,
  quizAttempts,
  quizAnswers,
  QuestionType,
} from "~/db/schema";

// ─── Quiz Service ───
// Handles quiz CRUD, question/option management, and attempt recording.
// Uses positional parameters (project convention).

// ─── Quiz CRUD ───

export function getQuizById(id: number) {
  return db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1).then(r => r[0]);
}

export function getQuizByLessonId(lessonId: number) {
  return db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId)).limit(1).then(r => r[0]);
}

export async function getQuizWithQuestions(quizId: number) {
  const quiz = await getQuizById(quizId);
  if (!quiz) return null;

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.position);

  const questionsWithOptions = await Promise.all(
    questions.map(async (question) => {
      const options = await db
        .select()
        .from(quizOptions)
        .where(eq(quizOptions.questionId, question.id));

      return { ...question, options };
    })
  );

  return { ...quiz, questions: questionsWithOptions };
}

export function createQuiz(
  lessonId: number,
  title: string,
  passingScore: number
) {
  return db
    .insert(quizzes)
    .values({ lessonId, title, passingScore })
    .returning().then(r => r[0]);
}

export function updateQuiz(
  id: number,
  title: string | null,
  passingScore: number | null
) {
  const updates: Record<string, unknown> = {};
  if (title !== null) updates.title = title;
  if (passingScore !== null) updates.passingScore = passingScore;

  if (Object.keys(updates).length === 0) {
    return getQuizById(id);
  }

  return db
    .update(quizzes)
    .set(updates)
    .where(eq(quizzes.id, id))
    .returning().then(r => r[0]);
}

export async function deleteQuiz(id: number) {
  // Cascade: delete answers -> attempts -> options -> questions -> quiz
  const questions = await getQuestionsByQuiz(id);
  for (const question of questions) {
    await db.delete(quizOptions).where(eq(quizOptions.questionId, question.id));
  }

  const attempts = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.quizId, id))

  for (const attempt of attempts) {
    await db.delete(quizAnswers).where(eq(quizAnswers.attemptId, attempt.id));
  }

  await db.delete(quizAttempts).where(eq(quizAttempts.quizId, id));
  await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id));
  return db.delete(quizzes).where(eq(quizzes.id, id)).returning();
}

// ─── Question Management ───

export function getQuestionById(id: number) {
  return db.select().from(quizQuestions).where(eq(quizQuestions.id, id)).limit(1).then(r => r[0]);
}

export function getQuestionsByQuiz(quizId: number) {
  return db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.position)

}

export async function getQuestionCount(quizId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .limit(1).then(r => r[0]);
  return result?.count ?? 0;
}

export async function createQuestion(
  quizId: number,
  questionText: string,
  questionType: QuestionType,
  position: number | null
) {
  const pos =
    position ??
    ((await db
      .select({
        max: sql<number>`coalesce(max(${quizQuestions.position}), 0)`,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .limit(1).then(r => r[0]))!.max + 1);

  return db
    .insert(quizQuestions)
    .values({ quizId, questionText, questionType, position: pos })
    .returning().then(r => r[0]);
}

export function updateQuestion(
  id: number,
  questionText: string | null,
  questionType: QuestionType | null
) {
  const updates: Record<string, unknown> = {};
  if (questionText !== null) updates.questionText = questionText;
  if (questionType !== null) updates.questionType = questionType;

  if (Object.keys(updates).length === 0) {
    return getQuestionById(id);
  }

  return db
    .update(quizQuestions)
    .set(updates)
    .where(eq(quizQuestions.id, id))
    .returning().then(r => r[0]);
}

export async function deleteQuestion(id: number) {
  await db.delete(quizOptions).where(eq(quizOptions.questionId, id));
  return db
    .delete(quizQuestions)
    .where(eq(quizQuestions.id, id))
    .returning().then(r => r[0]);
}

// ─── Question Reordering ───

export async function moveQuestionToPosition(
  questionId: number,
  newPosition: number
) {
  const question = await getQuestionById(questionId);
  if (!question) return null;

  const oldPosition = question.position;
  if (oldPosition === newPosition) return question;

  if (newPosition > oldPosition) {
    await db.update(quizQuestions)
      .set({ position: sql`${quizQuestions.position} - 1` })
      .where(
        and(
          eq(quizQuestions.quizId, question.quizId),
          sql`${quizQuestions.position} > ${oldPosition}`,
          sql`${quizQuestions.position} <= ${newPosition}`
        )
      )

  } else {
    await db.update(quizQuestions)
      .set({ position: sql`${quizQuestions.position} + 1` })
      .where(
        and(
          eq(quizQuestions.quizId, question.quizId),
          sql`${quizQuestions.position} >= ${newPosition}`,
          sql`${quizQuestions.position} < ${oldPosition}`
        )
      )

  }

  return db
    .update(quizQuestions)
    .set({ position: newPosition })
    .where(eq(quizQuestions.id, questionId))
    .returning().then(r => r[0]);
}

export async function reorderQuestions(quizId: number, questionIds: number[]) {
  for (let i = 0; i < questionIds.length; i++) {
    await db.update(quizQuestions)
      .set({ position: i + 1 })
      .where(
        and(
          eq(quizQuestions.id, questionIds[i]),
          eq(quizQuestions.quizId, quizId)
        )
      )

  }
  return getQuestionsByQuiz(quizId);
}

// ─── Option Management ───

export function getOptionById(id: number) {
  return db.select().from(quizOptions).where(eq(quizOptions.id, id)).limit(1).then(r => r[0]);
}

export function getOptionsByQuestion(questionId: number) {
  return db
    .select()
    .from(quizOptions)
    .where(eq(quizOptions.questionId, questionId))

}

export function createOption(
  questionId: number,
  optionText: string,
  isCorrect: boolean
) {
  return db
    .insert(quizOptions)
    .values({ questionId, optionText, isCorrect })
    .returning().then(r => r[0]);
}

export function updateOption(
  id: number,
  optionText: string | null,
  isCorrect: boolean | null
) {
  const updates: Record<string, unknown> = {};
  if (optionText !== null) updates.optionText = optionText;
  if (isCorrect !== null) updates.isCorrect = isCorrect;

  if (Object.keys(updates).length === 0) {
    return getOptionById(id);
  }

  return db
    .update(quizOptions)
    .set(updates)
    .where(eq(quizOptions.id, id))
    .returning().then(r => r[0]);
}

export function deleteOption(id: number) {
  return db.delete(quizOptions).where(eq(quizOptions.id, id)).returning();
}

// ─── Attempt Recording ───

export function getAttemptById(id: number) {
  return db.select().from(quizAttempts).where(eq(quizAttempts.id, id)).limit(1).then(r => r[0]);
}

export function getAttemptsByUser(userId: number, quizId: number) {
  return db
    .select()
    .from(quizAttempts)
    .where(
      and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId))
    )
    .orderBy(desc(quizAttempts.attemptedAt))

}

export async function getAttemptCountForQuiz(quizId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(quizAttempts)
    .where(eq(quizAttempts.quizId, quizId))
    .limit(1).then(r => r[0]);
  return result?.count ?? 0;
}

export function getBestAttempt(userId: number, quizId: number) {
  return db
    .select()
    .from(quizAttempts)
    .where(
      and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId))
    )
    .orderBy(desc(quizAttempts.score))
    .limit(1)
    .limit(1).then(r => r[0]);
}

export function getLatestAttempt(userId: number, quizId: number) {
  return db
    .select()
    .from(quizAttempts)
    .where(
      and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId))
    )
    .orderBy(desc(quizAttempts.attemptedAt))
    .limit(1)
    .limit(1).then(r => r[0]);
}

export function recordAttempt(
  userId: number,
  quizId: number,
  score: number,
  passed: boolean
) {
  return db
    .insert(quizAttempts)
    .values({ userId, quizId, score, passed })
    .returning().then(r => r[0]);
}

export function recordAnswer(
  attemptId: number,
  questionId: number,
  selectedOptionId: number
) {
  return db
    .insert(quizAnswers)
    .values({ attemptId, questionId, selectedOptionId })
    .returning().then(r => r[0]);
}

export function getAnswersByAttempt(attemptId: number) {
  return db
    .select()
    .from(quizAnswers)
    .where(eq(quizAnswers.attemptId, attemptId))

}

export async function getAttemptWithAnswers(attemptId: number) {
  const attempt = await getAttemptById(attemptId);
  if (!attempt) return null;

  const answers = await getAnswersByAttempt(attemptId);
  return { ...attempt, answers };
}
