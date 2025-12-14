import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";

// Auth components
import { ProtectedRoute, GuestRoute } from "@/components/auth";
import { DashboardLayout } from "@/components/layout";

// Public pages
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

// Teacher pages
import {
  TeacherDashboard,
  CreateTaskPage,
  StudentManagementPage,
  StudentDetailPage,
  AddNewStudentPage,
  ClassManagementPage,
  ReportPage,
  TeacherProfilePage,
} from "@/pages/teacher";

// Student pages
import { StudentDashboard, ProgressPage, ProfilePage as StudentProfilePage, ReportDetailPage, WritingSubmissionPage, SpeakingSubmissionPage, ScoringProgressPage } from "@/pages/student";

// Route constants
import { ROUTES } from "@/constants";

function App() {
  return (
    <div>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Public routes - accessible only when NOT logged in */}
          <Route
            path={ROUTES.SIGNIN}
            element={
              <GuestRoute>
                <SignInPage />
              </GuestRoute>
            }
          />
          <Route
            path={ROUTES.SIGNUP}
            element={
              <GuestRoute>
                <SignUpPage />
              </GuestRoute>
            }
          />

          {/* Email verification & Password reset - accessible to everyone */}
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={
              <GuestRoute>
                <ForgotPasswordPage />
              </GuestRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Teacher routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherDashboard />} />
            <Route path="create-task" element={<CreateTaskPage />} />
            <Route path="students" element={<StudentManagementPage />} />
            <Route path="students/add" element={<AddNewStudentPage />} />
            <Route path="students/:studentId" element={<StudentDetailPage />} />
            <Route path="classes" element={<ClassManagementPage />} />
            <Route path="reports" element={<ReportPage />} />
            <Route path="profile" element={<TeacherProfilePage />} />
            {/* Add more teacher routes here:
            <Route path="settings" element={<TeacherSettings />} />
            */}
          </Route>

          {/* Student routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["learner"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
            <Route path="report/:submissionId" element={<ReportDetailPage />} />
            <Route path="scoring/:attemptId" element={<ScoringProgressPage />} />
            <Route path="submit/writing/:assignmentId" element={<WritingSubmissionPage />} />
            <Route path="submit/speaking/:assignmentId" element={<SpeakingSubmissionPage />} />
            {/* Add more student routes here:
            <Route path="courses" element={<StudentCourses />} />
            <Route path="courses/:id" element={<StudentCourseDetail />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="settings" element={<StudentSettings />} />
            */}
          </Route>

          {/* Root redirect - will be handled by auth state */}
          <Route
            path={ROUTES.HOME}
            element={<Navigate to={ROUTES.SIGNIN} replace />}
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
