import { useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  ArrowLeftRight,
  Wallet
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CryptoBalanceCard from "@/components/admin/CryptoBalanceCard";
import TrendChart from "@/components/admin/TrendChart";
import RecentActivityTable from "@/components/admin/RecentActivityTable";

// Genera montos aleatorios realistas (totales ~250M) en cada carga
const rand = (min: number, max: number, decimals = 2) =>
  Number((min + Math.random() * (max - min)).toFixed(decimals));

const randChange = () => {
  const v = rand(-4, 5, 2);
  return Math.abs(v) < 0.05 ? 0.05 : v;
};

const generateCryptoBalances = () => {
  const btcUsd = rand(190_000_000, 225_000_000);
  const btcPrice = rand(96_500, 104_800);
  const ethUsd = rand(12_000_000, 22_000_000);
  const ethPrice = rand(3_100, 3_750);
  const bnbUsd = rand(5_000_000, 9_500_000);
  const bnbPrice = rand(580, 690);
  const usdtUsd = rand(6_000_000, 11_000_000);
  const ltcUsd = rand(800_000, 1_600_000);
  const ltcPrice = rand(92, 118);

  return [
    { symbol: "BTC", name: "Bitcoin", balance: Number((btcUsd / btcPrice).toFixed(4)), usdValue: btcUsd, change: randChange(), color: "#F7931A" },
    { symbol: "ETH", name: "Ethereum", balance: Number((ethUsd / ethPrice).toFixed(2)), usdValue: ethUsd, change: randChange(), color: "#627EEA" },
    { symbol: "BNB", name: "Binance Coin", balance: Number((bnbUsd / bnbPrice).toFixed(2)), usdValue: bnbUsd, change: randChange(), color: "#F3BA2F" },
    { symbol: "USDT", name: "Tether", balance: usdtUsd, usdValue: usdtUsd, change: rand(-0.05, 0.08, 2), color: "#26A17B" },
    { symbol: "LTC", name: "Litecoin", balance: Number((ltcUsd / ltcPrice).toFixed(2)), usdValue: ltcUsd, change: randChange(), color: "#BFBBBB" },
  ];
};

const generateStats = () => [
  { title: "Usuarios Activos", value: rand(1_100, 1_450, 0).toLocaleString("en-US"), change: `+${rand(8, 18, 1)}%`, icon: Users, positive: true },
  { title: "Empresas", value: String(rand(75, 105, 0)), change: `+${rand(3, 8, 1)}%`, icon: Building2, positive: true },
  { title: "Transacciones Hoy", value: rand(2_800, 4_200, 0).toLocaleString("en-US"), change: `+${rand(15, 30, 1)}%`, icon: ArrowLeftRight, positive: true },
  { title: "Volumen 24h", value: `$${rand(1.8, 3.2, 1)}M`, change: `-${rand(1, 5, 1)}%`, icon: Wallet, positive: false },
];

const Overview = () => {
  const cryptoBalances = useMemo(generateCryptoBalances, []);
  const stats = useMemo(generateStats, []);
  const totalUsdValue = cryptoBalances.reduce((acc, crypto) => acc + crypto.usdValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-admin-text">Vista General</h1>
        <p className="text-admin-muted mt-1">Resumen del estado de la plataforma</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-admin-card border-admin-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-admin-muted">{stat.title}</p>
                  <p className="text-2xl font-bold text-admin-text mt-1">{stat.value}</p>
                  <div className={`flex items-center gap-1 mt-1 ${stat.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stat.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span className="text-xs font-medium">{stat.change}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-admin-accent/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-admin-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Balance */}
      <Card className="bg-gradient-to-r from-admin-accent to-admin-accent-light border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Balance Total de la Plataforma</p>
              <p className="text-4xl font-bold text-white mt-2">
                ${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-white/70 text-sm mt-2">Distribuido en 5 criptomonedas</p>
            </div>
            <div className="hidden md:block">
              <Wallet className="w-24 h-24 text-white/20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crypto Balances Grid */}
      <div>
        <h2 className="text-lg font-semibold text-admin-text mb-4">Saldos por Criptomoneda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {cryptoBalances.map((crypto) => (
            <CryptoBalanceCard key={crypto.symbol} crypto={crypto} />
          ))}
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart />
        </div>
        <div>
          <RecentActivityTable />
        </div>
      </div>
    </div>
  );
};

export default Overview;
