import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  // Auto logout after 3 hours
  useSessionTimeout();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-admin-bg">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
