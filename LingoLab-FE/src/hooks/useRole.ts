import { useAuthStore } from "@/stores";
import type { UserRole } from "@/types";

/**
 * Hook to check user roles and permissions
 */
export function useRole() {
  const { user, hasRole } = useAuthStore();

  return {
    role: user?.role,
    isTeacher: user?.role === "teacher",
    isStudent: user?.role === "learner",
    isLearner: user?.role === "learner",
    hasRole,
    canAccess: (allowedRoles: UserRole[]) => {
      if (!user) return false;
      return allowedRoles.includes(user.role);
    },
  };
}
