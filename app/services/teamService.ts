import { eq, and } from "drizzle-orm";
import { db } from "~/db";
import { teams, teamMembers, TeamMemberRole } from "~/db/schema";

// ─── Team Service ───
// Handles team creation, admin assignment, and team lookup by user.
// One team per user (auto-created on first team purchase).

export function createTeam() {
  return db.insert(teams).values({}).returning().then(r => r[0]);
}

export function addTeamMember(
  teamId: number,
  userId: number,
  role: TeamMemberRole
) {
  return db
    .insert(teamMembers)
    .values({ teamId, userId, role })
    .returning().then(r => r[0]);
}

export async function getTeamForAdmin(userId: number) {
  const membership = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.userId, userId),
        eq(teamMembers.role, TeamMemberRole.Admin)
      )
    )
    .limit(1).then(r => r[0]);

  if (!membership) return undefined;

  return db.select().from(teams).where(eq(teams.id, membership.teamId)).limit(1).then(r => r[0]);
}

export async function getOrCreateTeamForUser(userId: number) {
  const existingTeam = await getTeamForAdmin(userId);
  if (existingTeam) return existingTeam;

  const team = await createTeam();
  await addTeamMember(team.id, userId, TeamMemberRole.Admin);
  return team;
}

export async function isTeamAdmin(userId: number) {
  return !!(await getTeamForAdmin(userId));
}

export function getTeamMembers(teamId: number) {
  return db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId))

}
