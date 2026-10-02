import { useState, useEffect } from "react";
import { LayoutDashboard, ArrowLeftRight, Globe, Settings, Wallet, LogOut, ArrowDownLeft, ArrowUpRight, Shield, AlertCircle, CheckCircle, Building2 } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const UserSidebar = () => {
  const [userName, setUserName] = useState("Usuario");
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("U");
  const [verificationStatus, setVerificationStatus] = useState<string>("pending");
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, verification_status")
          .eq("user_id", user.id)
          .single();
        
        if (profile) {
          if (profile.full_name) {
            setUserName(profile.full_name);
            const initials = profile.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            setUserInitials(initials);
          }
          setVerificationStatus(profile.verification_status || 'pending');
        }
      }
    };

    fetchUserData();

    // Subscribe to profile changes for realtime verification status updates
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      const channel = supabase
        .channel('sidebar-profile')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newProfile = payload.new as any;
            setVerificationStatus(newProfile.verification_status || 'pending');
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/");
  };

  const menuItems = [
    { title: "Mi Billetera", url: "/dashboard/wallet", icon: Wallet },
    { title: "Mis Cuentas de Banco", url: "/dashboard/bank-account", icon: Building2 },
    { title: "Depositar", url: "/dashboard/deposit", icon: ArrowDownLeft },
    { title: "Retirar", url: "/dashboard/withdraw", icon: ArrowUpRight },
    { title: "Transacciones", url: "/dashboard/transactions", icon: ArrowLeftRight },
    { title: "Pagos Internacionales", url: "/dashboard/international", icon: Globe },
    { title: "Configuración", url: "/dashboard/settings", icon: Settings },
  ];

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case 'pending':
      case 'rejected':
        return (
          <Badge variant="outline" className="ml-auto bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'submitted':
        return (
          <Badge variant="outline" className="ml-auto bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs">
            En revisión
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="ml-auto bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verificado
          </Badge>
        );
      default:
        return null;
    }
  };

  const needsVerification = verificationStatus === 'pending' || verificationStatus === 'rejected';

  return (
    <Sidebar className="border-r border-border bg-card" collapsible="offcanvas">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center justify-center">
          <img src={logo} alt="Quantum Ledger Business" className="h-12 w-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
            Menú Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Vista General first */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/dashboard" 
                    end
                    onClick={handleNavClick}
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? "bg-primary/10 text-primary border-l-2 border-primary" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`
                    }
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-sm font-medium">Vista General</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Verification item with special styling */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/dashboard/verification" 
                    onClick={handleNavClick}
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? "bg-primary/10 text-primary border-l-2 border-primary" 
                          : needsVerification
                            ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-l-2 border-amber-500"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`
                    }
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Verificar Cuenta</span>
                    {getVerificationBadge()}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {menuItems.filter(item => item.url !== "/dashboard").map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                     <NavLink 
                       to={item.url} 
                       end={item.url === "/dashboard"} 
                       onClick={handleNavClick}
                       className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? "bg-primary/10 text-primary border-l-2 border-primary" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-xs font-semibold">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full mt-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default UserSidebar;
