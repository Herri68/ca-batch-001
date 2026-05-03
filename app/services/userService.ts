import { eq } from "drizzle-orm";
import { db } from "~/db";
import { users, UserRole } from "~/db/schema";

// ─── User Service ───
// Handles user CRUD operations and role management.
// Uses positional parameters (project convention).

export function getAllUsers() {
  return db.select().from(users);
}

export function getUserById(id: number) {
  return db.select().from(users).where(eq(users.id, id)).limit(1).then(r => r[0]);
}

export function getUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email)).limit(1).then(r => r[0]);
}

export function getUsersByRole(role: UserRole) {
  return db.select().from(users).where(eq(users.role, role));
}

export function createUser(
  name: string,
  email: string,
  role: UserRole,
  avatarUrl: string | null
) {
  return db
    .insert(users)
    .values({ name, email, role, avatarUrl })
    .returning().then(r => r[0]);
}

export function updateUser(
  id: number,
  name: string,
  email: string,
  bio: string | null
) {
  return db
    .update(users)
    .set({ name, email, bio })
    .where(eq(users.id, id))
    .returning().then(r => r[0]);
}

export function updateUserRole(id: number, role: UserRole) {
  return db
    .update(users)
    .set({ role })
    .where(eq(users.id, id))
    .returning().then(r => r[0]);
}
