import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, ArrowUpRight, ArrowDownLeft, Copy, QrCode, Plus, RefreshCw, Lock, CheckCircle, Clock, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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
const WalletPage = () => {
  const navigate = useNavigate();
  const [balances, setBalances] = useState({
    usd: 0,
    btc: 0,
    eth: 0,
    usdt: 0,
    bnb: 0,
    ltc: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiresActivation, setRequiresActivation] = useState(false);
  
  const fetchData = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (user) {
      // Fetch profile
      const {
        data: profile
      } = await supabase.from("profiles").select("usd, btc, eth, usdt, bnb, ltc, is_activated, show_activation_modal").eq("user_id", user.id).single();
      if (profile) {
        setBalances({
          usd: profile.usd || 0,
          btc: profile.btc || 0,
          eth: profile.eth || 0,
          usdt: profile.usdt || 0,
          bnb: profile.bnb || 0,
          ltc: profile.ltc || 0
        });
        setRequiresActivation(!!profile.show_activation_modal && !profile.is_activated);
      }


      // Fetch transactions
      const {
        data: txData
      } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", {
        ascending: false
      }).limit(20);
      if (txData) {
        setTransactions(txData);
      }
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchData();

    // Get user for realtime subscription filter
    supabase.auth.getUser().then(({
      data: {
        user
      }
    }) => {
      if (!user) return;

      // Subscribe to realtime updates for profile/balances
      const profileChannel = supabase.channel('wallet-profile').on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        const newProfile = payload.new as any;
        setBalances({
          usd: newProfile.usd || 0,
          btc: newProfile.btc || 0,
          eth: newProfile.eth || 0,
          usdt: newProfile.usdt || 0,
          bnb: newProfile.bnb || 0,
          ltc: newProfile.ltc || 0
        });
        setRequiresActivation(!!newProfile.show_activation_modal && !newProfile.is_activated);

      }).subscribe();

      // Subscribe to realtime updates for transactions
      const txChannel = supabase.channel('wallet-transactions').on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        setTransactions(prev => [payload.new as Transaction, ...prev].slice(0, 20));
      }).subscribe();
      return () => {
        supabase.removeChannel(profileChannel);
        supabase.removeChannel(txChannel);
      };
    });
  }, []);
  const walletAddresses = [{
    symbol: "USD",
    name: "Dólar Estadounidense",
    balance: balances.usd,
    usdValue: balances.usd,
    color: "#22C55E",
    address: null,
    isFiat: true,
    isActive: true
  }, {
    symbol: "BTC",
    name: "Bitcoin",
    balance: balances.btc,
    usdValue: balances.btc * 43000,
    color: "#F7931A",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    isFiat: false,
    isActive: !requiresActivation || balances.btc > 0
  }, {
    symbol: "ETH",
    name: "Ethereum",
    balance: balances.eth,
    usdValue: balances.eth * 2200,
    color: "#627EEA",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f...",
    isFiat: false,
    isActive: !requiresActivation || balances.eth > 0
  }, {
    symbol: "USDT",
    name: "Tether",
    balance: balances.usdt,
    usdValue: balances.usdt,
    color: "#26A17B",
    address: "TXYZabc123def456ghi789jkl012mno345...",
    isFiat: false,
    isActive: !requiresActivation || balances.usdt > 0
  }, {
    symbol: "BNB",
    name: "Binance Coin",
    balance: balances.bnb,
    usdValue: balances.bnb * 310,
    color: "#F3BA2F",
    address: "bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2",
    isFiat: false,
    isActive: !requiresActivation || balances.bnb > 0
  }, {
    symbol: "LTC",
    name: "Litecoin",
    balance: balances.ltc,
    usdValue: balances.ltc * 70,
    color: "#BFBBBB",
    address: "ltc1q8c6fshw2dlwun7ekn9qwf37cu2rn755upcp6el",
    isFiat: false,
    isActive: !requiresActivation || balances.ltc > 0
  }];
  const totalBalance = walletAddresses.reduce((acc, wallet) => acc + wallet.usdValue, 0);
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Dirección copiada al portapapeles");
  };
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
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20"
    };
    const labels = {
      completed: "Completado",
      pending: "Pendiente",
      cancelled: "Cancelado"
    };
    return <Badge variant="outline" className={styles[status as keyof typeof styles] || styles.pending}>
        {labels[status as keyof typeof labels] || status}
      </Badge>;
  };
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi Billetera</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus criptomonedas y transacciones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-gradient-to-r from-primary to-accent border-0 overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-primary-foreground/70 text-sm">Balance Total</p>
              <p className="text-4xl font-bold text-primary-foreground mt-2">
                ${totalBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2
              })}
              </p>
              <p className="text-primary-foreground/70 text-sm mt-2">
                USD: ${balances.usd.toLocaleString('en-US', {
                minimumFractionDigits: 2
              })}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
                onClick={() => navigate('/dashboard/deposit')}
              >
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Depositar
              </Button>
            </div>
          </div>
          <div className="absolute right-0 top-0 opacity-10">
            <Wallet className="w-48 h-48 text-primary-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Wallet Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Mis Cuentas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {walletAddresses.map(wallet => <Card key={wallet.symbol} className={`transition-all ${!wallet.isFiat && !wallet.isActive ? 'opacity-60 border-dashed' : 'hover:border-accent/30'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{
                  backgroundColor: `${wallet.color}20`
                }}>
                      <span className="font-bold text-sm" style={{
                    color: wallet.color
                  }}>
                        {wallet.symbol === "USD" ? "$" : wallet.symbol}
                      </span>
                      {!wallet.isFiat && !wallet.isActive && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-muted rounded-full flex items-center justify-center">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        </div>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{wallet.name}</p>
                        {!wallet.isFiat && (wallet.isActive ? <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activa
                            </Badge> : <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
                              <Lock className="w-3 h-3 mr-1" />
                              Pendiente
                            </Badge>)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {wallet.isFiat ? `$${wallet.balance.toFixed(2)}` : `${wallet.balance} ${wallet.symbol}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      ${wallet.usdValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2
                  })}
                    </p>
                  </div>
                </div>
                
                {wallet.isFiat ? <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Cuenta en dólares</p>
                    <p className="text-sm text-foreground">Disponible para retiros y transferencias</p>
                  </div> : !wallet.isActive ? <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4 text-amber-500" />
                      <p className="text-sm font-medium text-amber-500">Cuenta pendiente de activación</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tu cuenta de {wallet.name} será activada por un administrador. Recibirás una notificación cuando esté lista.
                    </p>
                  </div> : <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Dirección de depósito</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-foreground truncate flex-1">
                        {wallet.address}
                      </code>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copyAddress(wallet.address!)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <QrCode className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>}

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1" disabled={!wallet.isFiat && !wallet.isActive}>
                    <ArrowDownLeft className="w-3 h-3 mr-1" />
                    {wallet.isFiat ? "Agregar fondos" : "Depositar"}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" disabled={wallet.balance === 0 || !wallet.isFiat && !wallet.isActive}>
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    {wallet.isFiat ? "Retirar" : "Enviar"}
                  </Button>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Wallet className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Sin transacciones</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Aún no tienes movimientos. Realiza tu primer depósito para comenzar a operar.
              </p>
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Hacer primer depósito
              </Button>
            </div> : <div className="space-y-3">
              {transactions.map(tx => <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5 text-emerald-500" /> : <ArrowUpRight className="w-5 h-5 text-red-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {tx.type === 'deposit' ? 'Depósito' : 'Retiro'} de {tx.crypto}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {formatDate(tx.created_at)}
                      </p>
                      {tx.description && <p className="text-xs text-muted-foreground mt-1">{tx.description}</p>}
                      {tx.transaction_hash && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Hash className="w-3 h-3" />
                          {tx.transaction_hash.slice(0, 20)}...
                        </p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}{tx.amount} {tx.crypto}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ≈ ${(tx.usd_value || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2
                })}
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default WalletPage;