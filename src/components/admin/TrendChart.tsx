import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Ene", btc: 4000, eth: 2400, total: 6400 },
  { name: "Feb", btc: 3000, eth: 1398, total: 4398 },
  { name: "Mar", btc: 2000, eth: 9800, total: 11800 },
  { name: "Abr", btc: 2780, eth: 3908, total: 6688 },
  { name: "May", btc: 1890, eth: 4800, total: 6690 },
  { name: "Jun", btc: 2390, eth: 3800, total: 6190 },
  { name: "Jul", btc: 3490, eth: 4300, total: 7790 },
  { name: "Ago", btc: 4200, eth: 5100, total: 9300 },
  { name: "Sep", btc: 5100, eth: 4800, total: 9900 },
  { name: "Oct", btc: 4800, eth: 5200, total: 10000 },
  { name: "Nov", btc: 5500, eth: 5800, total: 11300 },
  { name: "Dic", btc: 6200, eth: 6100, total: 12300 },
];

const TrendChart = () => {
  return (
    <Card className="bg-admin-card border-admin-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-admin-text text-lg">Tendencia de Saldos</CardTitle>
        <p className="text-sm text-admin-muted">Evolución mensual del volumen total</p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#06B6D4" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendChart;
