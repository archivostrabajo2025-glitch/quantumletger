import { useState } from "react";
import { 
  Shield, 
  Key, 
  Smartphone, 
  Lock,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const SecurityPage = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(true);

  const securityEvents = [
    { id: 1, event: "Inicio de sesión exitoso", ip: "192.168.1.100", date: "2024-04-15 14:32", status: "success" },
    { id: 2, event: "Cambio de contraseña", ip: "192.168.1.100", date: "2024-04-14 10:15", status: "success" },
    { id: 3, event: "Intento de acceso fallido", ip: "203.45.67.89", date: "2024-04-13 23:45", status: "failed" },
    { id: 4, event: "2FA activado", ip: "192.168.1.100", date: "2024-04-12 09:30", status: "success" },
    { id: 5, event: "API Key regenerada", ip: "192.168.1.100", date: "2024-04-10 16:20", status: "success" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-text">Configuración de Seguridad</h1>
        <p className="text-admin-muted mt-1">Gestiona la seguridad de la plataforma</p>
      </div>

      {/* Security Status */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-admin-accent/10 border-emerald-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-admin-text">Estado de Seguridad: Óptimo</h3>
              <p className="text-admin-muted">Todas las medidas de seguridad están activas</p>
            </div>
            <Badge className="ml-auto bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              Protegido
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2FA Settings */}
        <Card className="bg-admin-card border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-text flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-admin-accent" />
              Autenticación de Dos Factores (2FA)
            </CardTitle>
            <CardDescription className="text-admin-muted">
              Añade una capa extra de seguridad a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
              <div>
                <p className="font-medium text-admin-text">2FA para Administradores</p>
                <p className="text-sm text-admin-muted">Requiere código al iniciar sesión</p>
              </div>
              <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
            </div>
            <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
              <div>
                <p className="font-medium text-admin-text">2FA para Usuarios</p>
                <p className="text-sm text-admin-muted">Opcional para cuentas de usuario</p>
              </div>
              <Switch checked={true} />
            </div>
            <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
              <div>
                <p className="font-medium text-admin-text">2FA para Empresas</p>
                <p className="text-sm text-admin-muted">Obligatorio para cuentas corporativas</p>
              </div>
              <Switch checked={true} />
            </div>
          </CardContent>
        </Card>

        {/* Session Settings */}
        <Card className="bg-admin-card border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-text flex items-center gap-2">
              <Lock className="w-5 h-5 text-admin-accent" />
              Control de Sesiones
            </CardTitle>
            <CardDescription className="text-admin-muted">
              Configura la gestión de sesiones activas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
              <div>
                <p className="font-medium text-admin-text">Timeout de Sesión</p>
                <p className="text-sm text-admin-muted">Cierra sesión tras 30 min de inactividad</p>
              </div>
              <Switch checked={sessionTimeout} onCheckedChange={setSessionTimeout} />
            </div>
            <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
              <div>
                <p className="font-medium text-admin-text">Lista Blanca de IPs</p>
                <p className="text-sm text-admin-muted">Solo permite acceso desde IPs autorizadas</p>
              </div>
              <Switch checked={ipWhitelist} onCheckedChange={setIpWhitelist} />
            </div>
            <div className="space-y-2">
              <Label className="text-admin-muted">IPs Autorizadas</Label>
              <Input 
                className="bg-admin-bg border-admin-border font-mono text-sm" 
                defaultValue="192.168.1.0/24, 10.0.0.1"
              />
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="bg-admin-card border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-text flex items-center gap-2">
              <Key className="w-5 h-5 text-admin-accent" />
              API Keys
            </CardTitle>
            <CardDescription className="text-admin-muted">
              Gestiona las claves de acceso a la API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-admin-muted">API Key Principal</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    className="bg-admin-bg border-admin-border font-mono text-sm pr-10" 
                    type={showApiKey ? "text" : "password"}
                    defaultValue="sk_live_quantum_4f8g9h2j3k5l6m7n8o9p0q1r2s3t4u5v"
                    readOnly
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-text h-7 w-7"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button variant="outline" size="icon" className="border-admin-border text-admin-muted hover:text-admin-text">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-500">Precaución</p>
                  <p className="text-xs text-admin-muted mt-1">
                    Nunca compartas tu API Key. Regenerar la clave invalidará la anterior.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Encryption */}
        <Card className="bg-admin-card border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-text flex items-center gap-2">
              <Shield className="w-5 h-5 text-admin-accent" />
              Cifrado de Datos
            </CardTitle>
            <CardDescription className="text-admin-muted">
              Estado del cifrado de información sensible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-admin-text">AES-256 Activo</p>
                  <p className="text-sm text-admin-muted">Datos en reposo cifrados</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-admin-text">TLS 1.3</p>
                  <p className="text-sm text-admin-muted">Comunicaciones cifradas</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-admin-text">Claves Privadas HSM</p>
                  <p className="text-sm text-admin-muted">Hardware Security Module</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Events */}
      <Card className="bg-admin-card border-admin-border">
        <CardHeader>
          <CardTitle className="text-admin-text">Registro de Eventos de Seguridad</CardTitle>
          <CardDescription className="text-admin-muted">Últimas actividades relacionadas con seguridad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityEvents.map((event) => (
              <div 
                key={event.id} 
                className="flex items-center justify-between p-3 bg-admin-bg rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    event.status === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {event.status === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-admin-text">{event.event}</p>
                    <p className="text-xs text-admin-muted">IP: {event.ip}</p>
                  </div>
                </div>
                <span className="text-sm text-admin-muted">{event.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityPage;
