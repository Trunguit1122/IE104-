import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants";
import type { UserRole } from "@/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// Teacher navigation
export const teacherNavigation: NavSection[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: ROUTES.TEACHER.DASHBOARD,
        icon: LayoutDashboard,
      },
      {
        title: "Classes",
        href: ROUTES.TEACHER.CLASSES,
        icon: BookOpen,
      },
      {
        title: "Students",
        href: ROUTES.TEACHER.STUDENTS,
        icon: Users,
      },
      {
        title: "Reports",
        href: ROUTES.TEACHER.REPORTS,
        icon: ClipboardList,
      },
    ],
  },
];

// Student navigation
export const studentNavigation: NavSection[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: ROUTES.STUDENT.DASHBOARD,
        icon: LayoutDashboard,
      },
      {
        title: "Progress",
        href: ROUTES.STUDENT.PROGRESS,
        icon: BarChart3,
      },
    ],
  },
];

// Get navigation based on role
export const getNavigationByRole = (role: UserRole): NavSection[] => {
  switch (role) {
    case "student":
      return studentNavigation;
    case "teacher":
      return teacherNavigation;
    default:
      return [];
  }
};
