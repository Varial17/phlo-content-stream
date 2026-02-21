import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import CalendarPage from "@/pages/Calendar";
import IdeationPage from "@/pages/Ideation";
import AnalyticsPage from "@/pages/Analytics";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route
            path="/calendar"
            element={
              <AppLayout>
                <CalendarPage />
              </AppLayout>
            }
          />
          <Route
            path="/ideation"
            element={
              <AppLayout>
                <IdeationPage />
              </AppLayout>
            }
          />
          <Route
            path="/analytics"
            element={
              <AppLayout>
                <AnalyticsPage />
              </AppLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
