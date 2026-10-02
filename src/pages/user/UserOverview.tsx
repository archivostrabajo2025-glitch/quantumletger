import { useState, useEffect, useMemo } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, Hash, Shield, CheckCircle, XCircle, AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import CryptoBalanceCard from "@/components/admin/CryptoBalanceCard";
import { Link } from "react-router-dom";
import { ActivationModal } from "@/components/ActivationModal";

interface Transaction {
  id: string;
  type: string;
  crypto: string;
  amount: number;
  usd_value: number;
  status: string;
  description: string | null;
  transaction_hash: string | null;
  created_at: string;
}

const UserOverview = () => {
  const [balances, setBalances] = useState({
    usd: 0,
    btc: 0,
    eth: 0,
    usdt: 0,
    bnb: 0,
    ltc: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<string>('pending');
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showActivationCard, setShowActivationCard] = useState<boolean>(true);
  const [showCustomNotification, setShowCustomNotification] = useState<boolean>(false);
  const [customNotificationTitle, setCustomNotificationTitle] = useState<string>("");
  const [customNotificationMessage, setCustomNotificationMessage] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("usd, btc, eth, usdt, bnb, ltc, verification_status, is_activated, show_activation_modal, show_custom_notification, custom_notification_title, custom_notification_message")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setBalances({
            usd: profile.usd || 0,
            btc: profile.btc || 0,
            eth: profile.eth || 0,
            usdt: profile.usdt || 0,
            bnb: profile.bnb || 0,
            ltc: profile.ltc || 0,
          });
          setVerificationStatus(profile.verification_status || 'pending');
          setIsActivated(profile.is_activated || false);
          setShowActivationCard(profile.show_activation_modal === true);
          setShowCustomNotification(profile.show_custom_notification || false);
          setCustomNotificationTitle(profile.custom_notification_title || "");
          setCustomNotificationMessage(profile.custom_notification_message || "");
        }

        // Fetch transactions
        const { data: txData } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (txData) {
          setTransactions(txData);
        }
      }
      setLoading(false);
    };

    fetchData();

    // Get user for realtime subscription filter
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      // Subscribe to realtime updates for transactions
      const txChannel = supabase
        .channel('user-transactions')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setTransactions(prev => [payload.new as Transaction, ...prev].slice(0, 10));
          }
        )
        .subscribe();

      // Subscribe to realtime updates for profile/balances
      const profileChannel = supabase
        .channel('user-profile')
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
            setBalances({
              usd: newProfile.usd || 0,
              btc: newProfile.btc || 0,
              eth: newProfile.eth || 0,
              usdt: newProfile.usdt || 0,
              bnb: newProfile.bnb || 0,
              ltc: newProfile.ltc || 0,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(txChannel);
        supabase.removeChannel(profileChannel);
      };
    });
  }, []);

  // Precios actuales con variación aleatoria realista en cada carga
  const rand = (min: number, max: number) => min + Math.random() * (max - min);
  const prices = useMemo(() => ({
    btc: rand(96_500, 104_800),
    eth: rand(3_100, 3_750),
    bnb: rand(580, 690),
    ltc: rand(92, 118),
  }), []);
  const changes = useMemo(() => ({
    btc: Number(rand(-3.5, 4.5).toFixed(2)),
    eth: Number(rand(-3.5, 4.5).toFixed(2)),
    usdt: Number(rand(-0.05, 0.08).toFixed(2)),
    bnb: Number(rand(-3.5, 4.5).toFixed(2)),
    ltc: Number(rand(-3.5, 4.5).toFixed(2)),
  }), []);

  const cryptoData = [
    { symbol: "BTC", name: "Bitcoin", balance: balances.btc, usdValue: balances.btc * prices.btc, change: changes.btc, color: "#F7931A" },
    { symbol: "ETH", name: "Ethereum", balance: balances.eth, usdValue: balances.eth * prices.eth, change: changes.eth, color: "#627EEA" },
    { symbol: "USDT", name: "Tether", balance: balances.usdt, usdValue: balances.usdt, change: changes.usdt, color: "#26A17B" },
    { symbol: "BNB", name: "Binance Coin", balance: balances.bnb, usdValue: balances.bnb * prices.bnb, change: changes.bnb, color: "#F3BA2F" },
    { symbol: "LTC", name: "Litecoin", balance: balances.ltc, usdValue: balances.ltc * prices.ltc, change: changes.ltc, color: "#BFBBBB" },
  ];

  const totalBalance = balances.usd + cryptoData.reduce((acc, c) => acc + c.usdValue, 0);

  // Calculate monthly stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyDeposits = transactions
    .filter(tx => {
      const txDate = new Date(tx.created_at);
      return tx.type === 'deposit' && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    })
    .reduce((acc, tx) => acc + (tx.usd_value || 0), 0);

  const monthlyWithdrawals = transactions
    .filter(tx => {
      const txDate = new Date(tx.created_at);
      return tx.type === 'withdrawal' && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    })
    .reduce((acc, tx) => acc + (tx.usd_value || 0), 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    const labels = {
      completed: "Completado",
      pending: "Pendiente",
      cancelled: "Cancelado",
    };
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles] || styles.pending}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getVerificationBanner = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-500 font-semibold">Verificación Pendiente</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Tu cuenta aún no está verificada. Verifica tu identidad para acceder a todas las funciones.
              </span>
              <Button asChild size="sm" className="ml-4">
                <Link to="/dashboard/verification">
                  <Shield className="w-4 h-4 mr-2" />
                  Verificar Ahora
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        );
      case 'submitted':
        return (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Clock className="h-5 w-5 text-blue-500" />
            <AlertTitle className="text-blue-500 font-semibold">Verificación en Proceso</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Tu documentación está siendo revisada. Te notificaremos cuando el proceso termine.
            </AlertDescription>
          </Alert>
        );
      case 'approved':
        return (
          <Alert className="border-emerald-500/50 bg-emerald-500/10">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <AlertTitle className="text-emerald-500 font-semibold">Cuenta Verificada</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Tu cuenta está verificada. Tienes acceso completo a todas las funciones.
            </AlertDescription>
          </Alert>
        );
      case 'rejected':
        return (
          <Alert className="border-red-500/50 bg-red-500/10">
            <XCircle className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-red-500 font-semibold">Verificación Rechazada</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Tu verificación fue rechazada. Por favor, vuelve a enviar tu documentación.
              </span>
              <Button asChild size="sm" variant="destructive" className="ml-4">
                <Link to="/dashboard/verification">
                  <Shield className="w-4 h-4 mr-2" />
                  Reintentar
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vista General</h1>
        <p className="text-muted-foreground">Resumen de tu cuenta</p>
      </div>

      {/* Verification Banner */}
      {getVerificationBanner()}

      {/* Custom Notification from Admin */}
      {showCustomNotification && customNotificationMessage && (
        <Alert className="border-primary/50 bg-primary/5">
          <AlertCircle className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary font-semibold">
            {customNotificationTitle || "Aviso importante"}
          </AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {customNotificationMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Account Activation Section - only shown if admin enabled it */}
      {showActivationCard && (
        <Card 
          className={`border-2 border-dashed cursor-pointer transition-all ${
            isActivated 
              ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10' 
              : 'border-accent/50 bg-accent/5 hover:border-accent hover:bg-accent/10'
          }`}
          onClick={() => setShowActivationModal(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                isActivated ? 'bg-emerald-500/20' : 'bg-accent/20'
              }`}>
                {isActivated ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Sparkles className="w-6 h-6 text-accent" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {isActivated ? 'Cuenta Activada' : 'Activación de Cuenta'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {isActivated 
                    ? 'Tu cuenta está activa. Puedes realizar transferencias bancarias.'
                    : 'Ver estado de activación y realizar depósito de activación USDT'
                  }
                </p>
              </div>
              <ArrowUpRight className={`w-5 h-5 ${isActivated ? 'text-emerald-500' : 'text-accent'}`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activation Modal */}
      <ActivationModal open={showActivationModal} onOpenChange={setShowActivationModal} />

      {/* Total Balance Card */}
      <Card className="bg-gradient-primary text-primary-foreground border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm">Balance Total</p>
              <h2 className="text-3xl font-bold mt-1">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-primary-foreground/60 text-sm mt-2">USD: ${balances.usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crypto Balances */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Mis Criptomonedas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {cryptoData.map((crypto) => (
            <CryptoBalanceCard key={crypto.symbol} crypto={crypto} />
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Depósitos este mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-emerald-500" />
              <span className="text-2xl font-bold text-foreground">
                ${monthlyDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Retiros este mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold text-foreground">
                ${monthlyWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tienes transacciones aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'deposit' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    }`}>
                      {tx.type === 'deposit' ? (
                        <ArrowDownRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {tx.type === 'deposit' ? 'Depósito' : 'Retiro'} de {tx.crypto}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {formatDate(tx.created_at)}
                      </p>
                      {tx.description && (
                        <p className="text-xs text-muted-foreground mt-1">{tx.description}</p>
                      )}
                      {tx.transaction_hash && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Hash className="w-3 h-3" />
                          {tx.transaction_hash.slice(0, 16)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}{tx.amount} {tx.crypto}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ≈ ${(tx.usd_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOverview;
