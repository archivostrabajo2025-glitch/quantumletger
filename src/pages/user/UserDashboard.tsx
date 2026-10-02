import { Outlet } from "react-router-dom";
import UserSidebar from "@/components/user/UserSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

const UserDashboard = () => {
  // Auto logout after 3 hours
  useSessionTimeout();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-admin-bg">
        <UserSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header with menu trigger */}
          <div className="lg:hidden flex items-center gap-2 p-4 border-b border-border bg-card">
            <SidebarTrigger className="shrink-0" />
            <span className="font-semibold text-foreground">Quantum Ledger</span>
          </div>
          {/* Desktop header */}
          <div className="hidden lg:block">
            <AdminHeader />
          </div>
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UserDashboard;
