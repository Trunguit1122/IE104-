import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "@/stores";
import type { UserRole } from "@/types";
import { ROUTES } from "@/constants";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading, isHydrated, isValidatingToken } = useAuthStore();
  const location = useLocation();

  // Show loading state while:
  // 1. Store is not yet hydrated from localStorage
  // 2. Token is being validated
  // 3. Any auth operation is in progress
  if (!isHydrated || isValidatingToken || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Redirect to login if not authenticated (after validation is complete)
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.SIGNIN} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath =
      user.role === "learner"
        ? ROUTES.STUDENT.DASHBOARD
        : ROUTES.TEACHER.DASHBOARD;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
