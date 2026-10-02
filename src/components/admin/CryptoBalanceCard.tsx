import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CryptoBalanceCardProps {
  crypto: {
    symbol: string;
    name: string;
    balance: number;
    usdValue: number;
    change: number;
    color: string;
  };
}

const CryptoBalanceCard = ({ crypto }: CryptoBalanceCardProps) => {
  const isPositive = crypto.change >= 0;

  return (
    <Card className="bg-card border-border hover:border-accent/30 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: crypto.color }}
          >
            {crypto.symbol.slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{crypto.symbol}</p>
            <p className="text-xs text-muted-foreground">{crypto.name}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-lg font-bold text-foreground">
            {crypto.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}
          </p>
          <p className="text-sm text-muted-foreground">
            ${crypto.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-xs font-medium">{isPositive ? '+' : ''}{crypto.change}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CryptoBalanceCard;
