import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

const activities = [
  { id: 1, type: "deposit", user: "Carlos M.", amount: "0.5 BTC", time: "Hace 5 min", usd: "$21,650" },
  { id: 2, type: "withdraw", user: "TechCorp Ltd", amount: "1,500 USDT", time: "Hace 12 min", usd: "$1,500" },
  { id: 3, type: "deposit", user: "María G.", amount: "2.3 ETH", time: "Hace 25 min", usd: "$4,140" },
  { id: 4, type: "withdraw", user: "Global Trade", amount: "5 BNB", time: "Hace 1 hora", usd: "$1,250" },
  { id: 5, type: "deposit", user: "Juan P.", amount: "10 LTC", time: "Hace 2 horas", usd: "$700" },
];

const RecentActivityTable = () => {
  return (
    <Card className="bg-admin-card border-admin-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-admin-text text-lg">Actividad Reciente</CardTitle>
        <p className="text-sm text-admin-muted">Últimos movimientos</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-admin-bg hover:bg-admin-hover transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'deposit' 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {activity.type === 'deposit' 
                    ? <ArrowDownLeft className="w-4 h-4" /> 
                    : <ArrowUpRight className="w-4 h-4" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-admin-text">{activity.user}</p>
                  <p className="text-xs text-admin-muted">{activity.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  activity.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {activity.type === 'deposit' ? '+' : '-'}{activity.amount}
                </p>
                <p className="text-xs text-admin-muted">{activity.usd}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivityTable;
