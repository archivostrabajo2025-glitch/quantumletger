import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Auth from "./pages/Auth";

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Overview = lazy(() => import("./pages/admin/Overview"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const BusinessManagement = lazy(() => import("./pages/admin/BusinessManagement"));
const TransactionsPage = lazy(() => import("./pages/admin/TransactionsPage"));
const SecurityPage = lazy(() => import("./pages/admin/SecurityPage"));
const NotificationsPage = lazy(() => import("./pages/admin/NotificationsPage"));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage"));
const InternationalPayments = lazy(() => import("./pages/admin/InternationalPayments"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const WalletPage = lazy(() => import("./pages/admin/WalletPage"));
const VerificationManagement = lazy(() => import("./pages/admin/VerificationManagement"));
const ReceiptGeneratorPage = lazy(() => import("./pages/admin/ReceiptGeneratorPage"));
const EmailPreviewPage = lazy(() => import("./pages/admin/EmailPreviewPage"));
const SendDocumentsPage = lazy(() => import("./pages/admin/SendDocumentsPage"));

// User pages
const UserDashboard = lazy(() => import("./pages/user/UserDashboard"));
const UserOverview = lazy(() => import("./pages/user/UserOverview"));
const UserDepositPage = lazy(() => import("./pages/user/UserDepositPage"));
const UserWithdrawPage = lazy(() => import("./pages/user/UserWithdrawPage"));
const UserVerificationPage = lazy(() => import("./pages/user/UserVerificationPage"));
const UserTransactionsPage = lazy(() => import("./pages/user/UserTransactionsPage"));
const UserBankAccountPage = lazy(() => import("./pages/user/UserBankAccountPage"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Admin Routes - Only for admins */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }>
              <Route index element={<Overview />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="verifications" element={<VerificationManagement />} />
              <Route path="businesses" element={<BusinessManagement />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="international" element={<InternationalPayments />} />
              <Route path="security" element={<SecurityPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="receipts" element={<ReceiptGeneratorPage />} />
              <Route path="documents" element={<SendDocumentsPage />} />
              <Route path="emails" element={<EmailPreviewPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* User Routes - For regular users */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }>
              <Route index element={<UserOverview />} />
              <Route path="verification" element={<UserVerificationPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="deposit" element={<UserDepositPage />} />
              <Route path="withdraw" element={<UserWithdrawPage />} />
              <Route path="transactions" element={<UserTransactionsPage />} />
              <Route path="bank-account" element={<UserBankAccountPage />} />
              <Route path="international" element={<InternationalPayments />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;