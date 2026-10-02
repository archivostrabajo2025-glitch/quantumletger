import { useState, useEffect } from "react";
import { 
  User, 
  Palette,
  Save,
  Moon,
  Sun,
  Mail,
  MapPin,
  Loader2,
  Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";

const countries = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", 
  "Cuba", "Ecuador", "El Salvador", "España", "Estados Unidos", "Guatemala", 
  "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", 
  "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela"
];

const SettingsPage = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // User data
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setMounted(true);
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setEmail(user.email || "");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, country")
        .eq("user_id", user.id)
        .single();
      
      if (profile) {
        setFullName(profile.full_name || "");
        setCountry(profile.country || "Sin especificar");
      }
    }
    setIsLoading(false);
  };

  const isDarkMode = mounted ? theme === "dark" : true;

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
    toast({
      title: checked ? "Modo Oscuro Activado" : "Modo Claro Activado",
      description: "El tema se ha cambiado correctamente.",
    });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "No se pudo obtener la sesión del usuario.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        country: country,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido guardados correctamente.",
      });
    }
    
    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Cuenta</h1>
        <p className="text-muted-foreground mt-1">Administra tu información personal</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="profile" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <User className="w-4 h-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Lock className="w-4 h-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Palette className="w-4 h-4 mr-2" />
            Apariencia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Información Personal</CardTitle>
              <CardDescription className="text-muted-foreground">Actualiza tu información de cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-accent">
                    {fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{fullName || 'Usuario'}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nombre Completo
                  </Label>
                  <Input 
                    className="bg-background border-border"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Correo Electrónico
                  </Label>
                  <Input 
                    className="bg-background border-border"
                    value={email}
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">El email no puede ser modificado</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  País
                </Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="bg-background border-border max-w-md">
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Sin especificar">Sin especificar</SelectItem>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Cambiar Contraseña</CardTitle>
              <CardDescription className="text-muted-foreground">Actualiza tu contraseña de acceso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nueva Contraseña</Label>
                  <Input 
                    className="bg-background border-border"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Confirmar Nueva Contraseña</Label>
                  <Input 
                    className="bg-background border-border"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                  />
                </div>
              </div>

              <Button 
                onClick={handleChangePassword} 
                disabled={isSaving || !newPassword || !confirmPassword}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                Cambiar Contraseña
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Apariencia</CardTitle>
              <CardDescription className="text-muted-foreground">Personaliza la interfaz del panel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg max-w-md">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-accent" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">Modo Oscuro</p>
                    <p className="text-sm text-muted-foreground">Usar tema oscuro en el panel</p>
                  </div>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={handleThemeChange} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
