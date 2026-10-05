import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Building2, ArrowLeftRight, Shield, Bell, FileText, Globe, Settings, Wallet, LogOut, UserCheck, Receipt } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const menuItems = [{
  title: "Vista General",
  url: "/admin",
  icon: LayoutDashboard
}, {
  title: "Mi Billetera",
  url: "/admin/wallet",
  icon: Wallet
}, {
  title: "Usuarios",
  url: "/admin/users",
  icon: Users
}, {
  title: "Verificaciones",
  url: "/admin/verifications",
  icon: UserCheck
}, {
  title: "Empresas",
  url: "/admin/businesses",
  icon: Building2
}, {
  title: "Transacciones",
  url: "/admin/transactions",
  icon: ArrowLeftRight
}, {
  title: "Pagos Internacionales",
  url: "/admin/international",
  icon: Globe
}, {
  title: "Seguridad",
  url: "/admin/security",
  icon: Shield
}, {
  title: "Notificaciones",
  url: "/admin/notifications",
  icon: Bell
}, {
  title: "Generador de Comprobantes",
  url: "/admin/receipts",
  icon: Receipt
}, {
  title: "Informes",
  url: "/admin/reports",
  icon: FileText
}, {
  title: "Configuración",
  url: "/admin/settings",
  icon: Settings
}];

const AdminSidebar = () => {
  const [userName, setUserName] = useState("Usuario");
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("U");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        
        // Fetch profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name);
          const initials = profile.full_name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          setUserInitials(initials);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/");
  };

  return <Sidebar className="border-r border-admin-border bg-admin-sidebar">
      <SidebarHeader className="p-4 border-b border-admin-border">
        <div className="flex items-center justify-center">
          <img src={logo} alt="Quantum Ledger Business" className="h-32 w-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-admin-muted text-xs uppercase tracking-wider mb-2">
            Menú Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/admin"} className={({
                  isActive
                }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? "bg-admin-accent/10 text-admin-accent border-l-2 border-admin-accent" : "text-admin-muted hover:bg-admin-hover hover:text-admin-text"}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-admin-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-admin-accent/20 flex items-center justify-center">
            <span className="text-admin-accent text-xs font-semibold">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-admin-text truncate">{userName}</p>
            <p className="text-xs text-admin-muted truncate">{userEmail}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full mt-3 text-admin-muted hover:text-red-500 hover:bg-red-500/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>;
};
export default AdminSidebar;