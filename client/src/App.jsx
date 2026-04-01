import React, { lazy, Suspense, useEffect } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/useAuthStore";

// User
const Landing = lazy(() => import("./pages/Landing"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const Login = lazy(() => import("./pages/auth/Login"));
const EmailVerificationPage = lazy(
  () => import("./pages/auth/EmailVerificationPage"),
);
const ForgotPasswordPage = lazy(
  () => import("./pages/auth/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const Layout = lazy(() => import("./layout/Layout"));
const Dashboard = lazy(() => import("./pages/portal/dashboard/Dashboard"));
const Team = lazy(() => import("./pages/portal/team/Team"));
const JoinPage = lazy(() => import("./pages/portal/team/JoinPage"));
const Projects = lazy(() => import("./pages/portal/projects/Projects"));
const ProjectDetails = lazy(
  () => import("./pages/portal/projects/ProjectDetails"),
);
const Tasks = lazy(() => import("./pages/portal/tasks/Tasks"));
const TaskDetails = lazy(() => import("./pages/portal/tasks/TaskDetails"));
const Payment = lazy(() => import("./pages/portal/payment/Payment"));
const HandleSettings = lazy(
  () => import("./pages/portal/settings/HandleSettings"),
);

const NotFound = lazy(() => import("./pages/NotFound"));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return null;

  if (!isAuthenticated || !authUser) {
    return <Navigate to="/login" replace />;
  }

  if (!authUser.is_varified) {
    return <Navigate to="/varify_email" replace />;
  }

  return children;
};

const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, authUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return null;

  if (isAuthenticated && authUser?.is_varified) {
    <Navigate to="/dashboard" replace />;
  }
  return children;
};

const App = () => {
  const { checkAuth, isCheckingAuth } = useAuthStore();
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen w-full bg-white dark:bg-zinc-950">
      <Loader className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  if (isCheckingAuth) return <LoadingSpinner />;

  return (
    <>
      <Toaster />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/signup"
            element={
              <RedirectAuthenticatedUser>
                <Signup />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectAuthenticatedUser>
                <Login />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/forgot_password"
            element={
              <RedirectAuthenticatedUser>
                <ForgotPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/varify_email"
            element={
              <RedirectAuthenticatedUser>
                <EmailVerificationPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <RedirectAuthenticatedUser>
                <ResetPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="team">
              <Route index element={<Team />} />
              <Route path="join/:invite_code" element={<JoinPage />} />
            </Route>
            <Route path="projects">
              <Route index element={<Projects />} />
              <Route path="projectsDetail" element={<ProjectDetails />} />
            </Route>
            <Route path="tasks">
              <Route index element={<Tasks />} />
              <Route path="taskDetails" element={<TaskDetails />} />
            </Route>
            <Route path="payment" element={<Payment />} />
            <Route path="settings" element={<HandleSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
