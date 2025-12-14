import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";

interface GuestRouteProps {
  children: React.ReactNode;
}

/**
 * Route wrapper for pages that should only be accessible to non-authenticated users
 * (e.g., login, register pages)
 */
export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, user, isLoading, isHydrated, isValidatingToken } = useAuthStore();
  const location = useLocation();

  // Show loading state while:
  // 1. Store is not yet hydrated from localStorage
  // 2. Token is being validated
  // 3. Login/register is in progress
  if (!isHydrated || isValidatingToken || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If authenticated and validation complete, redirect to appropriate dashboard
  if (isAuthenticated && user) {
    // Check if there's a redirect location stored
    const from = (location.state as { from?: Location })?.from?.pathname;

    // Default redirect based on role
    const defaultRedirect =
      user.role === "learner"
        ? ROUTES.STUDENT.DASHBOARD
        : ROUTES.TEACHER.DASHBOARD;

    return <Navigate to={from || defaultRedirect} replace />;
  }

  return <>{children}</>;
}
