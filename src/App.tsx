import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";

import LoginPage from "@/pages/Login";
import { ClientLayout } from "@/components/client/ClientLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";

import ClientCalendarPage from "@/pages/client/Calendar";
import ClientIdeationPage from "@/pages/client/Ideation";
import ClientAnalyticsPage from "@/pages/client/Analytics";
import ClientBrandProfilePage from "@/pages/client/BrandProfile";

import AdminOverviewPage from "@/pages/admin/Overview";
import AdminAllPostsPage from "@/pages/admin/AllPosts";
import AdminCalendarViewPage from "@/pages/admin/CalendarView";
import AdminClientsPage from "@/pages/admin/Clients";
import AdminBillingPage from "@/pages/admin/Billing";
import AdminEmailPreviewPage from "@/pages/admin/EmailPreview";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { role, clientId, loading } = useAuth();
  if (loading) return null;
  if (role === "admin" || role === "staff") return <Navigate to="/admin" replace />;
  if (role === "client" && clientId) return <Navigate to={`/${clientId}`} replace />;
  // Default to admin for now (no role assigned yet)
  return <Navigate to="/admin" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<AuthGuard><RootRedirect /></AuthGuard>} />

            {/* Admin routes */}
            <Route path="/admin" element={<AuthGuard><AdminLayout><AdminOverviewPage /></AdminLayout></AuthGuard>} />
            <Route path="/admin/posts" element={<AuthGuard><AdminLayout><AdminAllPostsPage /></AdminLayout></AuthGuard>} />
            <Route path="/admin/clients" element={<AuthGuard><AdminLayout><AdminClientsPage /></AdminLayout></AuthGuard>} />
            <Route path="/admin/billing" element={<AuthGuard><AdminLayout><AdminBillingPage /></AdminLayout></AuthGuard>} />
            <Route path="/admin/email-preview/:postId" element={<AuthGuard><AdminEmailPreviewPage /></AuthGuard>} />

            {/* Client portal routes */}
            <Route path="/:clientSlug" element={<AuthGuard><ClientLayout><ClientCalendarPage /></ClientLayout></AuthGuard>} />
            <Route path="/:clientSlug/ideation" element={<AuthGuard><ClientLayout><ClientIdeationPage /></ClientLayout></AuthGuard>} />
            <Route path="/:clientSlug/analytics" element={<AuthGuard><ClientLayout><ClientAnalyticsPage /></ClientLayout></AuthGuard>} />
            <Route path="/:clientSlug/brand" element={<AuthGuard><ClientLayout><ClientBrandProfilePage /></ClientLayout></AuthGuard>} />
            <Route path="/:clientSlug/email-preview/:postId" element={<AuthGuard><AdminEmailPreviewPage /></AuthGuard>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
