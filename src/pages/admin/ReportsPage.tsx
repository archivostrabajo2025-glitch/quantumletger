import { useState } from "react";
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  PieChart,
  BarChart3,
  Users,
  Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts";

const volumeData = [
  { name: "Ene", deposits: 45000, withdrawals: 32000 },
  { name: "Feb", deposits: 52000, withdrawals: 38000 },
  { name: "Mar", deposits: 48000, withdrawals: 42000 },
  { name: "Abr", deposits: 61000, withdrawals: 45000 },
  { name: "May", deposits: 55000, withdrawals: 48000 },
  { name: "Jun", deposits: 67000, withdrawals: 52000 },
];

const cryptoDistribution = [
  { name: "BTC", value: 45, color: "#F7931A" },
  { name: "ETH", value: 25, color: "#627EEA" },
  { name: "USDT", value: 20, color: "#26A17B" },
  { name: "BNB", value: 7, color: "#F3BA2F" },
  { name: "LTC", value: 3, color: "#BFBBBB" },
];

const reportTemplates = [
  { id: 1, name: "Resumen Mensual", description: "Resumen completo de actividad mensual", icon: Calendar },
  { id: 2, name: "Análisis de Transacciones", description: "Detalle de todas las transacciones", icon: BarChart3 },
  { id: 3, name: "Reporte de Usuarios", description: "Estadísticas de usuarios y empresas", icon: Users },
  { id: 4, name: "Distribución de Activos", description: "Análisis de activos por criptomoneda", icon: PieChart },
  { id: 5, name: "Tendencias de Volumen", description: "Evolución del volumen de operaciones", icon: TrendingUp },
];

const ReportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-text">Informes y Análisis</h1>
          <p className="text-admin-muted mt-1">Genera y exporta informes detallados</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px] bg-admin-bg border-admin-border">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-admin-card border-admin-border">
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-admin-muted">Depósitos Totales</p>
                <p className="text-xl font-bold text-admin-text">$328,000</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />
              </div>
              <div>
                <p className="text-sm text-admin-muted">Retiros Totales</p>
                <p className="text-xl font-bold text-admin-text">$257,000</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-admin-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-admin-accent" />
              </div>
              <div>
                <p className="text-sm text-admin-muted">Nuevos Usuarios</p>
                <p className="text-xl font-bold text-admin-text">+234</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-admin-muted">Nuevas Empresas</p>
                <p className="text-xl font-bold text-admin-text">+12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume Chart */}
        <Card className="bg-admin-card border-admin-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-admin-text">Volumen de Operaciones</CardTitle>
            <CardDescription className="text-admin-muted">Depósitos vs Retiros mensuales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="deposits" fill="#10B981" radius={[4, 4, 0, 0]} name="Depósitos" />
                  <Bar dataKey="withdrawals" fill="#EF4444" radius={[4, 4, 0, 0]} name="Retiros" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card className="bg-admin-card border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-text">Distribución por Cripto</CardTitle>
            <CardDescription className="text-admin-muted">Porcentaje del volumen total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={cryptoDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {cryptoDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {cryptoDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-admin-muted">{item.name} {item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Templates */}
      <Card className="bg-admin-card border-admin-border">
        <CardHeader>
          <CardTitle className="text-admin-text">Plantillas de Informes</CardTitle>
          <CardDescription className="text-admin-muted">Genera informes predefinidos rápidamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <div 
                key={template.id}
                className="p-4 bg-admin-bg rounded-lg border border-admin-border hover:border-admin-accent/30 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-admin-accent/10 flex items-center justify-center group-hover:bg-admin-accent/20 transition-colors">
                    <template.icon className="w-5 h-5 text-admin-accent" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-admin-text">{template.name}</h4>
                    <p className="text-sm text-admin-muted mt-1">{template.description}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="border-admin-border text-admin-muted hover:text-admin-text text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        PDF
                      </Button>
                      <Button size="sm" variant="outline" className="border-admin-border text-admin-muted hover:text-admin-text text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Excel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
