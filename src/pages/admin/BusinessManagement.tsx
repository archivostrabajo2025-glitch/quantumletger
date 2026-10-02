import { useState } from "react";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Building2,
  CheckCircle,
  XCircle,
  Filter
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const mockBusinesses = [
  { id: 1, name: "TechCorp Solutions", email: "finance@techcorp.com", country: "Estados Unidos", status: "verified", balance: "$234,560", btc: "2.8", eth: "45.2", joined: "2024-01-10" },
  { id: 2, name: "Global Trade LLC", email: "admin@globaltrade.com", country: "Reino Unido", status: "verified", balance: "$189,230", btc: "1.9", eth: "32.1", joined: "2024-02-05" },
  { id: 3, name: "Innovex SA", email: "tesoreria@innovex.es", country: "España", status: "pending", balance: "$78,900", btc: "0.8", eth: "15.6", joined: "2024-03-15" },
  { id: 4, name: "LatAm Exports", email: "cfo@latamexports.mx", country: "México", status: "verified", balance: "$156,780", btc: "1.5", eth: "28.4", joined: "2024-01-22" },
  { id: 5, name: "Digital Ventures", email: "finance@digitalv.co", country: "Colombia", status: "suspended", balance: "$45,230", btc: "0.4", eth: "8.9", joined: "2024-04-01" },
];

const BusinessManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddBusinessOpen, setIsAddBusinessOpen] = useState(false);

  const filteredBusinesses = mockBusinesses.filter(business => 
    business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      verified: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      suspended: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    const labels = {
      verified: "Verificada",
      pending: "Pendiente",
      suspended: "Suspendida",
    };
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-text">Gestión de Empresas</h1>
          <p className="text-admin-muted mt-1">Administra las cuentas corporativas</p>
        </div>
        <Dialog open={isAddBusinessOpen} onOpenChange={setIsAddBusinessOpen}>
          <DialogTrigger asChild>
            <Button className="bg-admin-accent hover:bg-admin-accent-light">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-admin-card border-admin-border text-admin-text max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nombre de la Empresa</Label>
                <Input className="bg-admin-bg border-admin-border" placeholder="TechCorp Solutions" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Corporativo</Label>
                  <Input className="bg-admin-bg border-admin-border" placeholder="finance@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input className="bg-admin-bg border-admin-border" placeholder="+1 234 567 890" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>País</Label>
                  <Select>
                    <SelectTrigger className="bg-admin-bg border-admin-border">
                      <SelectValue placeholder="Seleccionar país" />
                    </SelectTrigger>
                    <SelectContent className="bg-admin-card border-admin-border">
                      <SelectItem value="us">Estados Unidos</SelectItem>
                      <SelectItem value="uk">Reino Unido</SelectItem>
                      <SelectItem value="es">España</SelectItem>
                      <SelectItem value="mx">México</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Empresa</Label>
                  <Select>
                    <SelectTrigger className="bg-admin-bg border-admin-border">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-admin-card border-admin-border">
                      <SelectItem value="llc">LLC</SelectItem>
                      <SelectItem value="sa">S.A.</SelectItem>
                      <SelectItem value="sl">S.L.</SelectItem>
                      <SelectItem value="corp">Corporation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Número de Registro Fiscal</Label>
                <Input className="bg-admin-bg border-admin-border" placeholder="XX-XXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>Dirección de Depósito (Demo)</Label>
                <Input 
                  className="bg-admin-bg border-admin-border font-mono text-xs" 
                  defaultValue="0x8d12A197cB00D4747a1fe03395095ce2A5CC6819..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsAddBusinessOpen(false)} className="border-admin-border text-admin-muted">
                  Cancelar
                </Button>
                <Button className="bg-admin-accent hover:bg-admin-accent-light">
                  Crear Empresa
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-admin-accent/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-admin-accent" />
              </div>
              <div>
                <p className="text-sm text-admin-muted">Total Empresas</p>
                <p className="text-xl font-bold text-admin-text">89</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-admin-muted">Verificadas</p>
                <p className="text-xl font-bold text-admin-text">72</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-admin-muted">Pendientes</p>
                <p className="text-xl font-bold text-admin-text">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-admin-muted">Suspendidas</p>
                <p className="text-xl font-bold text-admin-text">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-admin-card border-admin-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted" />
              <Input 
                placeholder="Buscar por nombre o email..." 
                className="pl-10 bg-admin-bg border-admin-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="border-admin-border text-admin-muted">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Table */}
      <Card className="bg-admin-card border-admin-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Empresa</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">País</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Estado</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Balance Total</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">BTC</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">ETH</th>
                  <th className="text-left p-4 text-sm font-medium text-admin-muted">Registro</th>
                  <th className="text-right p-4 text-sm font-medium text-admin-muted">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.map((business) => (
                  <tr key={business.id} className="border-b border-admin-border hover:bg-admin-hover transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-admin-accent to-admin-accent-light flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-admin-text">{business.name}</p>
                          <p className="text-sm text-admin-muted">{business.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-admin-text">{business.country}</td>
                    <td className="p-4">{getStatusBadge(business.status)}</td>
                    <td className="p-4 text-admin-text font-medium">{business.balance}</td>
                    <td className="p-4 text-admin-text">{business.btc}</td>
                    <td className="p-4 text-admin-text">{business.eth}</td>
                    <td className="p-4 text-admin-muted text-sm">{business.joined}</td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-admin-muted hover:text-admin-text">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-admin-card border-admin-border">
                          <DropdownMenuItem className="text-admin-text hover:bg-admin-hover cursor-pointer">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-admin-text hover:bg-admin-hover cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-admin-text hover:bg-admin-hover cursor-pointer">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verificar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 hover:bg-admin-hover cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessManagement;
