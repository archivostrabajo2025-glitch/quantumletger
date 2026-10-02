import { useState, useEffect } from "react";
import { 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TxRow = {
  id: string;
  type: string;
  user: string;
  userType: string;
  crypto: string;
  amount: string;
  usd: string;
  usdRaw: number;
  status: string;
  date: string;
  createdAt: string;
  hash: string;
};

const formatUsd = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return formatUsd(value);
};

const TransactionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cryptoFilter, setCryptoFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<TxRow | null>(null);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name, email");

    const names = new Map(
      (profilesData || []).map((p: any) => [p.user_id, p.full_name || p.email])
    );

    const rows: TxRow[] = (txData || []).map((tx: any) => {
      const created = new Date(tx.created_at);
      const usdRaw = Number(tx.usd_value ?? 0);
      return {
        id: `TX${tx.id.slice(0, 8).toUpperCase()}`,
        type: tx.type,
        user: names.get(tx.user_id) || "Usuario desconocido",
        userType: "user",
        crypto: (tx.crypto || "USD").toUpperCase(),
        amount: String(tx.amount),
        usd: formatUsd(usdRaw),
        usdRaw,
        status: tx.status,
        date: created.toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: tx.created_at,
        hash: tx.transaction_hash || tx.id,
      };
    });

    setTransactions(rows);
    setLoading(false);
  };

  useEffect(() => {
    loadTransactions();
    const channel = supabase
      .channel("admin-transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => loadTransactions()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isToday = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  const todayTx = transactions.filter((tx) => isToday(tx.createdAt));
  const depositTypes = ["deposit", "deposito", "depósito", "credit"];
  const isDeposit = (tx: TxRow) => depositTypes.includes(tx.type.toLowerCase());
  const totalVolume = transactions.reduce((acc, tx) => acc + tx.usdRaw, 0);
  const todayDeposits = todayTx.filter(isDeposit);
  const todayWithdrawals = todayTx.filter((tx) => !isDeposit(tx));
  const todayDepositsUsd = todayDeposits.reduce((acc, tx) => acc + tx.usdRaw, 0);
  const todayWithdrawalsUsd = todayWithdrawals.reduce((acc, tx) => acc + tx.usdRaw, 0);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || (typeFilter === "deposit" ? isDeposit(tx) : !isDeposit(tx));
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    const matchesCrypto = cryptoFilter === "all" || tx.crypto === cryptoFilter;
    return matchesSearch && matchesType && matchesStatus && matchesCrypto;
  });


  const getStatusBadge = (status: string) => {
    const config = {
      completed: { style: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle, label: "Completada" },
      pending: { style: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock, label: "Pendiente" },
      failed: { style: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle, label: "Fallida" },
    };
    const { style, icon: Icon, label } = config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant="outline" className={`${style} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transacciones</h1>
          <p className="text-muted-foreground mt-1">Historial completo de todas las transacciones de la empresa</p>
        </div>
        <Button variant="outline" className="border-admin-border text-admin-muted">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-4">
            <p className="text-sm text-admin-muted">Total Transacciones</p>
            <p className="text-2xl font-bold text-admin-text mt-1">{transactions.length.toLocaleString('en-US')}</p>
            <p className="text-xs text-emerald-500 mt-1">+{todayTx.length} hoy</p>
          </CardContent>
        </Card>
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-4">
            <p className="text-sm text-admin-muted">Volumen Total</p>
            <p className="text-2xl font-bold text-admin-text mt-1">{formatCompact(totalVolume)}</p>
            <p className="text-xs text-admin-muted mt-1">Histórico registrado</p>
          </CardContent>
        </Card>
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-4">
            <p className="text-sm text-admin-muted">Depósitos Hoy</p>
            <p className="text-2xl font-bold text-emerald-500 mt-1">+{formatCompact(todayDepositsUsd)}</p>
            <p className="text-xs text-admin-muted mt-1">{todayDeposits.length} transacciones</p>
          </CardContent>
        </Card>
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-4">
            <p className="text-sm text-admin-muted">Retiros Hoy</p>
            <p className="text-2xl font-bold text-red-500 mt-1">-{formatCompact(todayWithdrawalsUsd)}</p>
            <p className="text-xs text-admin-muted mt-1">{todayWithdrawals.length} transacciones</p>

          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-admin-card border-admin-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted" />
              <Input 
                placeholder="Buscar por ID o usuario..." 
                className="pl-10 bg-admin-bg border-admin-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] bg-admin-bg border-admin-border">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-admin-card border-admin-border">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="deposit">Depósitos</SelectItem>
                <SelectItem value="withdraw">Retiros</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-admin-bg border-admin-border">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-admin-card border-admin-border">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="failed">Fallidas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cryptoFilter} onValueChange={setCryptoFilter}>
              <SelectTrigger className="w-[140px] bg-admin-bg border-admin-border">
                <SelectValue placeholder="Cripto" />
              </SelectTrigger>
              <SelectContent className="bg-admin-card border-admin-border">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="BTC">Bitcoin</SelectItem>
                <SelectItem value="ETH">Ethereum</SelectItem>
                <SelectItem value="BNB">BNB</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="LTC">Litecoin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-admin-card border-admin-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">ID</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Tipo</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Usuario/Empresa</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Cripto</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Monto</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Valor USD</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Estado</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Fecha</th>
                  <th className="text-right p-4 text-sm font-medium text-admin-muted">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-admin-border hover:bg-admin-hover transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-sm text-admin-accent">{tx.id}</span>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                        isDeposit(tx)
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {isDeposit(tx) ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {isDeposit(tx) ? 'Depósito' : 'Retiro'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-admin-text font-medium">{tx.user}</p>
                        <p className="text-xs text-admin-muted">{tx.userType === 'user' ? 'Usuario' : 'Empresa'}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-admin-text font-medium">{tx.crypto}</span>
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${isDeposit(tx) ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isDeposit(tx) ? '+' : '-'}{tx.amount}
                      </span>
                    </td>

                    <td className="p-4 text-admin-text">{tx.usd}</td>
                    <td className="p-4">{getStatusBadge(tx.status)}</td>
                    <td className="p-4 text-admin-muted text-sm">{tx.date}</td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-admin-muted hover:text-admin-text"
                        onClick={() => setSelectedTransaction(tx)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-admin-muted">
                      No hay transacciones que coincidan con los filtros.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-admin-muted">
                      Cargando transacciones...
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="bg-admin-card border-admin-border text-admin-text max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles de Transacción</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-admin-muted">ID de Transacción</p>
                  <p className="font-mono text-admin-accent">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-admin-muted">Estado</p>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-admin-muted">Tipo</p>
                  <p className="text-admin-text capitalize">{isDeposit(selectedTransaction) ? 'Depósito' : 'Retiro'}</p>
                </div>
                <div>
                  <p className="text-sm text-admin-muted">Fecha</p>
                  <p className="text-admin-text">{selectedTransaction.date}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-admin-muted">Monto</p>
                  <p className="text-admin-text font-semibold">{selectedTransaction.amount} {selectedTransaction.crypto}</p>
                </div>
                <div>
                  <p className="text-sm text-admin-muted">Valor USD</p>
                  <p className="text-admin-text font-semibold">{selectedTransaction.usd}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-admin-muted">Usuario/Empresa</p>
                <p className="text-admin-text">{selectedTransaction.user}</p>
              </div>
              <div>
                <p className="text-sm text-admin-muted">Hash de Transacción</p>
                <p className="font-mono text-xs text-admin-muted break-all bg-admin-bg p-2 rounded mt-1">
                  {selectedTransaction.hash}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsPage;
