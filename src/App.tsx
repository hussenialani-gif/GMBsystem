import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./pages/layout/AppLayout.tsx";
import Dashboard from "./pages/dashboard/page.tsx";
import GoogleAccountsPage from "./pages/google-accounts/page.tsx";
import BusinessProfilesPage from "./pages/business-profiles/page.tsx";
import BusinessProfileDetailPage from "./pages/business-profiles/[id]/page.tsx";
import UsersPage from "./pages/users/page.tsx";
import NotificationsPage from "./pages/notifications/page.tsx";
import ActivityPage from "./pages/activity/page.tsx";
import SettingsPage from "./pages/settings/page.tsx";
import LandingPage from "./pages/Index.tsx";
import TasksPage from "./pages/tasks/page.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<LandingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/google-accounts" element={<GoogleAccountsPage />} />
            <Route path="/business-profiles" element={<BusinessProfilesPage />} />
            <Route path="/business-profiles/:id" element={<BusinessProfileDetailPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
