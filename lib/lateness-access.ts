import { isAdmin } from "./admin";
import { getCurrentUser, roleHomePath } from "./session";
import { SOCIAL_WORKER_POSITION } from "./positions";

export interface LateRecorder {
  id: string | null; // null when only the admin PIN is present
  name: string;
  // May delete anyone's records, not just their own.
  canModerate: boolean;
  homePath: string;
}

/** Anyone on staff may record late arrivals (the duty teacher rotates daily). */
export async function getLateRecorder(): Promise<LateRecorder | null> {
  const user = await getCurrentUser();
  if (user) {
    return {
      id: user.id,
      name: user.name,
      canModerate: user.role === "ADMIN" || user.position === SOCIAL_WORKER_POSITION,
      homePath: roleHomePath(user.role, user.position),
    };
  }
  if (await isAdmin()) {
    return { id: null, name: "Админ", canModerate: true, homePath: "/dashboard/admin" };
  }
  return null;
}

/** The school-wide report is for admins and the social worker only. */
export async function canViewLateReport(): Promise<boolean> {
  if (await isAdmin()) return true;
  const user = await getCurrentUser();
  return (
    !!user &&
    (user.role === "ADMIN" ||
      (user.role === "APPROVER" && user.position === SOCIAL_WORKER_POSITION))
  );
}
