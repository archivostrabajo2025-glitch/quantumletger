import { useState } from "react";
import { 
  Bell, 
  Mail, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Settings,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const recentNotifications = [
  { id: 1, type: "deposit", title: "Nuevo depósito recibido", message: "Carlos Martínez depositó 0.5 BTC", time: "Hace 5 min", read: false },
  { id: 2, type: "alert", title: "Alerta de saldo bajo", message: "La cuenta de TechCorp tiene saldo bajo en USDT", time: "Hace 15 min", read: false },
  { id: 3, type: "security", title: "Nuevo inicio de sesión", message: "Se detectó un inicio de sesión desde una nueva IP", time: "Hace 1 hora", read: true },
  { id: 4, type: "withdraw", title: "Retiro procesado", message: "Se procesó el retiro de Global Trade LLC", time: "Hace 2 horas", read: true },
  { id: 5, type: "system", title: "Mantenimiento programado", message: "Mantenimiento del sistema el próximo domingo", time: "Hace 1 día", read: true },
];

const NotificationsPage = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [depositAlerts, setDepositAlerts] = useState(true);
  const [withdrawAlerts, setWithdrawAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [thresholdAmount, setThresholdAmount] = useState("10000");

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'withdraw': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'security': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-admin-muted" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-text">Notificaciones y Alertas</h1>
        <p className="text-admin-muted mt-1">Configura cómo y cuándo recibir notificaciones</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notification Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Channels */}
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-text flex items-center gap-2">
                <Settings className="w-5 h-5 text-admin-accent" />
                Canales de Notificación
              </CardTitle>
              <CardDescription className="text-admin-muted">
                Elige cómo quieres recibir las notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-admin-accent" />
                  <div>
                    <p className="font-medium text-admin-text">Notificaciones por Email</p>
                    <p className="text-sm text-admin-muted">Recibe alertas en tu correo electrónico</p>
                  </div>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-admin-accent" />
                  <div>
                    <p className="font-medium text-admin-text">Notificaciones Push</p>
                    <p className="text-sm text-admin-muted">Alertas en tiempo real en el panel</p>
                  </div>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
              {emailNotifications && (
                <div className="space-y-2 pt-2">
                  <Label className="text-admin-muted">Email de notificaciones</Label>
                  <Input 
                    className="bg-admin-bg border-admin-border" 
                    defaultValue="admin@quantumledger.io"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert Types */}
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-text flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-admin-accent" />
                Tipos de Alertas
              </CardTitle>
              <CardDescription className="text-admin-muted">
                Selecciona qué eventos quieres monitorear
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
                <div>
                  <p className="font-medium text-admin-text">Alertas de Depósitos</p>
                  <p className="text-sm text-admin-muted">Notificar cuando se reciban depósitos</p>
                </div>
                <Switch checked={depositAlerts} onCheckedChange={setDepositAlerts} />
              </div>
              <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
                <div>
                  <p className="font-medium text-admin-text">Alertas de Retiros</p>
                  <p className="text-sm text-admin-muted">Notificar cuando se soliciten retiros</p>
                </div>
                <Switch checked={withdrawAlerts} onCheckedChange={setWithdrawAlerts} />
              </div>
              <div className="flex items-center justify-between p-4 bg-admin-bg rounded-lg">
                <div>
                  <p className="font-medium text-admin-text">Alertas de Seguridad</p>
                  <p className="text-sm text-admin-muted">Eventos de seguridad críticos</p>
                </div>
                <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
              </div>
            </CardContent>
          </Card>

          {/* Thresholds */}
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-text">Umbrales de Alerta</CardTitle>
              <CardDescription className="text-admin-muted">
                Configura los límites para recibir alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-admin-muted">Depósito mínimo para alerta</Label>
                  <div className="flex gap-2">
                    <Input 
                      className="bg-admin-bg border-admin-border" 
                      value={thresholdAmount}
                      onChange={(e) => setThresholdAmount(e.target.value)}
                    />
                    <Select defaultValue="usd">
                      <SelectTrigger className="w-24 bg-admin-bg border-admin-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-admin-card border-admin-border">
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="btc">BTC</SelectItem>
                        <SelectItem value="eth">ETH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-admin-muted">Retiro mínimo para alerta</Label>
                  <div className="flex gap-2">
                    <Input 
                      className="bg-admin-bg border-admin-border" 
                      defaultValue="5000"
                    />
                    <Select defaultValue="usd">
                      <SelectTrigger className="w-24 bg-admin-bg border-admin-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-admin-card border-admin-border">
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="btc">BTC</SelectItem>
                        <SelectItem value="eth">ETH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-admin-muted">Alerta de saldo bajo (por cuenta)</Label>
                <div className="flex gap-2">
                  <Input 
                    className="bg-admin-bg border-admin-border flex-1" 
                    defaultValue="1000"
                  />
                  <Select defaultValue="usd">
                    <SelectTrigger className="w-24 bg-admin-bg border-admin-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-admin-card border-admin-border">
                      <SelectItem value="usd">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Notifications */}
        <div>
          <Card className="bg-admin-card border-admin-border h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-admin-text">Notificaciones Recientes</CardTitle>
                <Badge variant="outline" className="bg-admin-accent/10 text-admin-accent border-admin-accent/20">
                  2 nuevas
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 rounded-lg transition-colors ${
                      notification.read ? 'bg-admin-bg' : 'bg-admin-accent/5 border border-admin-accent/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${notification.read ? 'text-admin-text' : 'text-admin-accent'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-admin-accent" />
                          )}
                        </div>
                        <p className="text-xs text-admin-muted mt-1 truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-admin-muted/70 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-admin-muted hover:text-admin-text">
                Ver todas las notificaciones
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
