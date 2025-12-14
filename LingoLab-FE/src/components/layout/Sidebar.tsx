import { NavLink, useNavigate } from "react-router";
import { LogOut, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { getNavigationByRole, type NavSection } from "@/config/navigation";
import type { UserRole } from "@/types";
import { ROUTES } from "@/constants";

export function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const navigation: NavSection[] = user
    ? getNavigationByRole(user.role as UserRole)
    : [];

  const handleLogout = () => {
    logout();
    navigate(ROUTES.SIGNIN);
  };

  const handleProfileClick = () => {
    if (user?.role === "teacher") {
      navigate(ROUTES.TEACHER.PROFILE);
    } else {
      navigate(ROUTES.STUDENT.PROFILE);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-screen sticky top-0 justify-between">
      {/* Logo */}
      <div>
        <div className="p-6 pb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-purple-200">
            <GraduationCap size={20} />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            LingoLab
          </span>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-1">
          {navigation.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-4">
              {section.title && (
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === ROUTES.TEACHER.DASHBOARD || item.href === ROUTES.STUDENT.DASHBOARD}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-purple-50 text-purple-700 ring-1 ring-purple-100"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )
                    }
                  >
                    <item.icon size={20} />
                    <span>{item.title}</span>
                    {item.badge !== undefined && (
                      <span className="ml-auto rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-xs font-medium">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Section */}
      <div className="px-4 py-4 border-t border-slate-100">
        {/* Profile Button */}
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left mb-2 group hover:bg-slate-50"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden shrink-0 group-hover:border-purple-200 transition-colors">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-purple-700 transition-colors">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">
              {user?.role || "Guest"}
            </p>
          </div>
        </button>

        {/* Sign Out Button */}
        <Button
          variant="ghost"
          className="w-full justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 h-9"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
