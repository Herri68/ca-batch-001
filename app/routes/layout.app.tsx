import { Outlet } from "react-router";
import type { Route } from "./+types/layout.app";
import { Sidebar } from "~/components/sidebar";
import { DevUI } from "~/components/dev-ui";
import { Toaster } from "sonner";
import { getAllUsers, getUserById } from "~/services/userService";
import { getCurrentUserId, getDevCountry } from "~/lib/session";
import {
  getRecentlyProgressedCourses,
  calculateProgress,
  getCompletedLessonCount,
  getTotalLessonCount,
} from "~/services/progressService";
import { getCountryTierInfo, COUNTRIES } from "~/lib/ppp";
import { isTeamAdmin } from "~/services/teamService";

export async function loader({ request }: Route.LoaderArgs) {
  const currentUserId = await getCurrentUserId(request);
  const [users, currentUser, devCountry, recentRaw, userIsTeamAdmin] = await Promise.all([
    getAllUsers(),
    currentUserId ? getUserById(currentUserId) : Promise.resolve(null),
    getDevCountry(request),
    currentUserId ? getRecentlyProgressedCourses(currentUserId) : Promise.resolve([]),
    currentUserId ? isTeamAdmin(currentUserId) : Promise.resolve(false),
  ]);
  const countryTierInfo = getCountryTierInfo(devCountry);

  const recentCourses = currentUserId
    ? await Promise.all(recentRaw.map(async (course) => {
        const [completedLessons, totalLessons, progress] = await Promise.all([
          getCompletedLessonCount(currentUserId, course.courseId),
          getTotalLessonCount(course.courseId),
          calculateProgress(currentUserId, course.courseId, false, false),
        ]);
        return {
          courseId: course.courseId,
          title: course.courseTitle,
          slug: course.courseSlug,
          coverImageUrl: course.coverImageUrl,
          completedLessons,
          totalLessons,
          progress,
        };
      }))
    : [];

  return {
    users: users.map((u) => ({ id: u.id, name: u.name, role: u.role })),
    currentUser: currentUser
      ? {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          avatarUrl: currentUser.avatarUrl ?? null,
        }
      : null,
    recentCourses,
    devCountry,
    countryTierInfo,
    countries: COUNTRIES,
    isTeamAdmin: userIsTeamAdmin,
  };
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const {
    users,
    currentUser,
    recentCourses,
    devCountry,
    countryTierInfo,
    countries,
    isTeamAdmin: userIsTeamAdmin,
  } = loaderData;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentUser={currentUser}
        recentCourses={recentCourses}
        isTeamAdmin={userIsTeamAdmin}
      />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <DevUI
        users={users}
        currentUser={currentUser}
        devCountry={devCountry}
        countryTierInfo={countryTierInfo}
        countries={countries}
      />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
