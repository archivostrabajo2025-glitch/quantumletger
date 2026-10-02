import { Bell, Search, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
const AdminHeader = () => {
  const [darkMode, setDarkMode] = useState(true);
  return <header className="h-16 border-b border-admin-border bg-admin-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-admin-muted hover:text-admin-text" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted" />
          <Input placeholder="Buscar usuarios, transacciones..." className="w-80 pl-10 bg-admin-bg border-admin-border text-admin-text placeholder:text-admin-muted focus:border-admin-accent" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        
        <Button variant="ghost" size="icon" className="text-admin-muted hover:text-admin-text hover:bg-admin-hover" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="text-admin-muted hover:text-admin-text hover:bg-admin-hover relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
            3
          </span>
        </Button>
      </div>
    </header>;
};
export default AdminHeader;