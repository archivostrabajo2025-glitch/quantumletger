import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Globe, 
  ArrowRight, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  Euro,
  PoundSterling,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Lock,
  FileText,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransferToBankModal } from "@/components/TransferToBankModal";

const exchangeRates = [
  { from: "BTC", to: "USD", rate: 43300, change: 2.4 },
  { from: "ETH", to: "USD", rate: 1800, change: -1.2 },
  { from: "BTC", to: "EUR", rate: 39800, change: 2.1 },
  { from: "BTC", to: "GBP", rate: 34100, change: 2.6 },
  { from: "USDT", to: "EUR", rate: 0.92, change: 0.1 },
  { from: "USDT", to: "MXN", rate: 20.40, change: -0.3 },
  { from: "USD", to: "MXN", rate: 20.40, change: -0.2 },
  { from: "USD", to: "EUR", rate: 0.92, change: 0.1 },
  { from: "USD", to: "GBP", rate: 0.79, change: 0.3 },
  { from: "USDT", to: "USD", rate: 1, change: 0.0 },
  { from: "BNB", to: "USD", rate: 315, change: 1.5 },
  // Centroamérica
  { from: "USD", to: "HNL", rate: 24.75, change: 0.1 },
  { from: "USD", to: "GTQ", rate: 7.82, change: -0.2 },
  { from: "USD", to: "CRC", rate: 515, change: 0.3 },
  { from: "USD", to: "PAB", rate: 1, change: 0.0 },
  { from: "USD", to: "NIO", rate: 36.75, change: 0.2 },
  // Sudamérica
  { from: "USD", to: "ARS", rate: 875, change: 0.5 },
  { from: "USD", to: "COP", rate: 3950, change: -0.4 },
  { from: "USD", to: "PEN", rate: 3.72, change: 0.1 },
  { from: "USD", to: "CLP", rate: 875, change: -0.3 },
  { from: "USD", to: "BRL", rate: 4.97, change: 0.2 },
  { from: "USD", to: "UYU", rate: 38.50, change: 0.1 },
  { from: "USD", to: "BOB", rate: 6.91, change: 0.0 },
  { from: "USD", to: "PYG", rate: 7350, change: -0.1 },
  // Crypto a monedas latinas
  { from: "USDT", to: "HNL", rate: 24.75, change: 0.1 },
  { from: "USDT", to: "GTQ", rate: 7.82, change: -0.1 },
  { from: "USDT", to: "COP", rate: 3950, change: -0.3 },
  { from: "USDT", to: "PEN", rate: 3.72, change: 0.2 },
  { from: "USDT", to: "ARS", rate: 875, change: 0.4 },
  { from: "BTC", to: "HNL", rate: 1071675, change: 2.5 },
  { from: "BTC", to: "COP", rate: 171085000, change: 2.1 },
  { from: "BTC", to: "ARS", rate: 37887500, change: 2.3 },
];

const recentConversions = [
  { id: "CV001", user: "TechCorp Solutions", from: "2.5 BTC", to: "$108,250 USD", status: "completed", date: "2024-04-15 14:00" },
  { id: "CV002", user: "Global Trade LLC", from: "50,000 USDT", to: "€46,000 EUR", status: "pending", date: "2024-04-15 13:30" },
  { id: "CV003", user: "Carlos Martínez", from: "5 ETH", to: "$9,000 USD", status: "completed", date: "2024-04-15 12:15" },
  { id: "CV004", user: "LatAm Exports", from: "10,000 USDT", to: "$171,500 MXN", status: "completed", date: "2024-04-15 11:00" },
  { id: "CV005", user: "Innovex SA", from: "1 BTC", to: "€39,800 EUR", status: "pending", date: "2024-04-15 10:30" },
];

const InternationalPayments = () => {
  const [fromAmount, setFromAmount] = useState("1");
  const [fromCurrency, setFromCurrency] = useState("BTC");
  const [toCurrency, setToCurrency] = useState("USD");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showActivationBlock, setShowActivationBlock] = useState(false);
  const [showCustomNotification, setShowCustomNotification] = useState(false);
  const [customNotificationTitle, setCustomNotificationTitle] = useState("");
  const [customNotificationMessage, setCustomNotificationMessage] = useState("");
  const [isCheckingActivation, setIsCheckingActivation] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isUserDashboard = location.pathname.startsWith("/dashboard");

  useEffect(() => {
    if (!isUserDashboard) {
      setIsCheckingActivation(false);
      return;
    }
    const checkActivation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("show_activation_modal, show_custom_notification, custom_notification_title, custom_notification_message")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile) {
          setShowActivationBlock(profile.show_activation_modal === true);
          setShowCustomNotification(profile.show_custom_notification === true);
          setCustomNotificationTitle(profile.custom_notification_title || "");
          setCustomNotificationMessage(profile.custom_notification_message || "");
        }
      }
      setIsCheckingActivation(false);
    };
    checkActivation();
  }, [isUserDashboard]);

  const getConversionRate = () => {
    const rate = exchangeRates.find(r => r.from === fromCurrency && r.to === toCurrency);
    return rate ? rate.rate : 1;
  };

  if (isCheckingActivation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isUserDashboard && showActivationBlock) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            Pagos Internacionales
          </h1>
          <p className="text-muted-foreground">Gestiona conversiones y pagos en diferentes monedas</p>
        </div>

        <Alert className="border-amber-500/50 bg-amber-500/10">
          <Lock className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-600 dark:text-amber-400 font-semibold">
            Cuenta no activada
          </AlertTitle>
          <AlertDescription className="text-amber-600/80 dark:text-amber-400/80">
            Para realizar pagos internacionales primero debes activar tu cuenta completando el proceso de <strong>Onboarding Fee</strong>.
          </AlertDescription>
        </Alert>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 flex flex-col items-center gap-4 py-10">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-muted-foreground text-center text-sm max-w-sm">
              Los pagos internacionales están bloqueados hasta completar la activación de tu cuenta. Una vez activada, podrás realizar transferencias.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="mt-2">
              Ver activación
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Block for custom notification
  if (isUserDashboard && showCustomNotification && customNotificationMessage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            Pagos Internacionales
          </h1>
          <p className="text-muted-foreground">Gestiona conversiones y pagos en diferentes monedas</p>
        </div>

        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-5 w-5 text-blue-500" />
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            Al completar el ingreso de documentos de validación internacional podrá efectuar transferencias de forma inmediata y verlas reflejadas en su cuenta bancaria en aproximadamente 10 minutos.
          </AlertDescription>
        </Alert>

        <Alert className="border-amber-500/50 bg-amber-500/10">
          <FileText className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-600 dark:text-amber-400 font-semibold">
            {customNotificationTitle || "Aviso"}
          </AlertTitle>
          <AlertDescription className="text-amber-600/80 dark:text-amber-400/80">
            {customNotificationMessage}
          </AlertDescription>
        </Alert>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 flex flex-col items-center gap-4 py-10">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-center text-sm max-w-sm">
              Tienes un aviso pendiente de tu administrador. Los pagos internacionales están restringidos hasta que se resuelva.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isUserDashboard ? 'text-foreground' : 'text-admin-text'}`}>Pagos Internacionales</h1>
        <p className={`mt-1 ${isUserDashboard ? 'text-muted-foreground' : 'text-admin-muted'}`}>Gestiona conversiones y pagos en diferentes monedas</p>
      </div>

      {/* Informational notice for user dashboard */}
      {isUserDashboard && (
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-5 w-5 text-blue-500" />
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            Al completar el ingreso de documentos de validación internacional podrá efectuar transferencias de forma inmediata y verlas reflejadas en su cuenta bancaria en aproximadamente 10 minutos.
          </AlertDescription>
        </Alert>
      )}

      {/* Exchange Rates */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {exchangeRates.map((rate, index) => (
          <Card key={index} className="bg-admin-card border-admin-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-1 text-sm text-admin-muted">
                <span className="font-medium">{rate.from}</span>
                <ArrowRight className="w-3 h-3" />
                <span className="font-medium">{rate.to}</span>
              </div>
              <p className="text-lg font-bold text-admin-text mt-1">
                {rate.rate.toLocaleString()}
              </p>
              <div className={`flex items-center gap-1 mt-1 text-xs ${rate.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                <TrendingUp className={`w-3 h-3 ${rate.change < 0 ? 'rotate-180' : ''}`} />
                {rate.change >= 0 ? '+' : ''}{rate.change}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Calculator */}
        <Card className="bg-admin-card border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-text flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-admin-accent" />
              Calculadora de Conversión
            </CardTitle>
            <CardDescription className="text-admin-muted">
              Simula conversiones en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-admin-muted">De</label>
              <div className="flex gap-2">
                <Input 
                  className="bg-admin-bg border-admin-border flex-1" 
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  type="number"
                />
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-24 bg-admin-bg border-admin-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-card border-admin-border">
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="BNB">BNB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-admin-bg flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-admin-accent rotate-90" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-admin-muted">A</label>
              <div className="flex gap-2">
                <Input 
                  className="bg-admin-bg border-admin-border flex-1" 
                  value={(parseFloat(fromAmount || "0") * getConversionRate()).toLocaleString()}
                  readOnly
                />
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-24 bg-admin-bg border-admin-border">
                    <SelectValue />
                  </SelectTrigger>
                <SelectContent className="bg-admin-card border-admin-border z-50 max-h-60">
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="HNL">HNL</SelectItem>
                    <SelectItem value="GTQ">GTQ</SelectItem>
                    <SelectItem value="CRC">CRC</SelectItem>
                    <SelectItem value="PAB">PAB</SelectItem>
                    <SelectItem value="NIO">NIO</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="COP">COP</SelectItem>
                    <SelectItem value="PEN">PEN</SelectItem>
                    <SelectItem value="CLP">CLP</SelectItem>
                    <SelectItem value="BRL">BRL</SelectItem>
                    <SelectItem value="UYU">UYU</SelectItem>
                    <SelectItem value="BOB">BOB</SelectItem>
                    <SelectItem value="PYG">PYG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 bg-admin-bg rounded-lg">
              <p className="text-sm text-admin-muted">Tasa de cambio</p>
              <p className="text-lg font-bold text-admin-text">
                1 {fromCurrency} = {getConversionRate().toLocaleString()} {toCurrency}
              </p>
            </div>

            <Button className="w-full bg-admin-accent hover:bg-admin-accent-light">
              Ejecutar Conversión
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-admin-border text-admin-text hover:bg-admin-hover"
              onClick={() => setShowTransferModal(true)}
            >
              Transferir a mi banco
            </Button>
          </CardContent>
        </Card>

        {/* Supported Currencies */}
        <Card className="bg-admin-card border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-text flex items-center gap-2">
              <Globe className="w-5 h-5 text-admin-accent" />
              Monedas Fiat Soportadas
            </CardTitle>
            <CardDescription className="text-admin-muted">
              Países y monedas disponibles para conversión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {/* Norteamérica y Europa */}
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-medium text-admin-text">USD - Dólar Americano</p>
                    <p className="text-xs text-admin-muted">Estados Unidos</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <Euro className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-admin-text">EUR - Euro</p>
                    <p className="text-xs text-admin-muted">Unión Europea</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <PoundSterling className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-admin-text">GBP - Libra Esterlina</p>
                    <p className="text-xs text-admin-muted">Reino Unido</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              {/* México */}
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-amber-500 font-bold text-sm">$</span>
                  <div>
                    <p className="font-medium text-admin-text">MXN - Peso Mexicano</p>
                    <p className="text-xs text-admin-muted">México</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              {/* Centroamérica */}
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-sky-500 font-bold text-sm">L</span>
                  <div>
                    <p className="font-medium text-admin-text">HNL - Lempira</p>
                    <p className="text-xs text-admin-muted">Honduras</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-indigo-500 font-bold text-sm">Q</span>
                  <div>
                    <p className="font-medium text-admin-text">GTQ - Quetzal</p>
                    <p className="text-xs text-admin-muted">Guatemala</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-red-500 font-bold text-sm">₡</span>
                  <div>
                    <p className="font-medium text-admin-text">CRC - Colón</p>
                    <p className="text-xs text-admin-muted">Costa Rica</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-teal-500 font-bold text-sm">B/</span>
                  <div>
                    <p className="font-medium text-admin-text">PAB - Balboa</p>
                    <p className="text-xs text-admin-muted">Panamá</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-orange-500 font-bold text-sm">C$</span>
                  <div>
                    <p className="font-medium text-admin-text">NIO - Córdoba</p>
                    <p className="text-xs text-admin-muted">Nicaragua</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              {/* Sudamérica */}
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-cyan-500 font-bold text-sm">$</span>
                  <div>
                    <p className="font-medium text-admin-text">ARS - Peso Argentino</p>
                    <p className="text-xs text-admin-muted">Argentina</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-yellow-500 font-bold text-sm">$</span>
                  <div>
                    <p className="font-medium text-admin-text">COP - Peso Colombiano</p>
                    <p className="text-xs text-admin-muted">Colombia</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-rose-500 font-bold text-sm">S/</span>
                  <div>
                    <p className="font-medium text-admin-text">PEN - Sol</p>
                    <p className="text-xs text-admin-muted">Perú</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-red-400 font-bold text-sm">$</span>
                  <div>
                    <p className="font-medium text-admin-text">CLP - Peso Chileno</p>
                    <p className="text-xs text-admin-muted">Chile</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-green-500 font-bold text-sm">R$</span>
                  <div>
                    <p className="font-medium text-admin-text">BRL - Real</p>
                    <p className="text-xs text-admin-muted">Brasil</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-blue-400 font-bold text-sm">$</span>
                  <div>
                    <p className="font-medium text-admin-text">UYU - Peso Uruguayo</p>
                    <p className="text-xs text-admin-muted">Uruguay</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-lime-500 font-bold text-sm">Bs</span>
                  <div>
                    <p className="font-medium text-admin-text">BOB - Boliviano</p>
                    <p className="text-xs text-admin-muted">Bolivia</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-admin-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-pink-500 font-bold text-sm">₲</span>
                  <div>
                    <p className="font-medium text-admin-text">PYG - Guaraní</p>
                    <p className="text-xs text-admin-muted">Paraguay</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="bg-admin-card border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-text">Estadísticas del Mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-admin-bg rounded-lg">
              <p className="text-sm text-admin-muted">Conversiones Totales</p>
              <p className="text-2xl font-bold text-admin-text mt-1">$1.2M</p>
              <p className="text-xs text-emerald-500">+15% vs mes anterior</p>
            </div>
            <div className="p-4 bg-admin-bg rounded-lg">
              <p className="text-sm text-admin-muted">Transacciones</p>
              <p className="text-2xl font-bold text-admin-text mt-1">847</p>
              <p className="text-xs text-emerald-500">+23% vs mes anterior</p>
            </div>
            <div className="p-4 bg-admin-bg rounded-lg">
              <p className="text-sm text-admin-muted">Moneda más convertida</p>
              <p className="text-2xl font-bold text-admin-text mt-1">USD</p>
              <p className="text-xs text-admin-muted">65% del volumen</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversions */}
      <Card className="bg-admin-card border-admin-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-admin-text">Conversiones Recientes</CardTitle>
              <CardDescription className="text-admin-muted">Historial de conversiones de moneda</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted" />
                <Input 
                  placeholder="Buscar..." 
                  className="pl-10 w-64 bg-admin-bg border-admin-border"
                />
              </div>
              <Button variant="outline" className="border-admin-border text-admin-muted">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">ID</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Usuario/Empresa</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">De</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">A</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Estado</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentConversions.map((conversion) => (
                  <tr key={conversion.id} className="border-b border-admin-border hover:bg-admin-hover transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-sm text-admin-accent">{conversion.id}</span>
                    </td>
                    <td className="p-4 text-admin-text">{conversion.user}</td>
                    <td className="p-4 text-admin-text font-medium">{conversion.from}</td>
                    <td className="p-4 text-admin-text font-medium">{conversion.to}</td>
                    <td className="p-4">
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 w-fit ${
                          conversion.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        {conversion.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {conversion.status === 'completed' ? 'Completada' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="p-4 text-admin-muted text-sm">{conversion.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <TransferToBankModal 
        open={showTransferModal} 
        onOpenChange={setShowTransferModal}
        amount={(parseFloat(fromAmount || "0") * getConversionRate()).toFixed(2)}
        currency={toCurrency}
      />
    </div>
  );
};

export default InternationalPayments;
