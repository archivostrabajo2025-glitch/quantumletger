import { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  UserX,
  Filter,
  Wallet,
  Loader2,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  Hash,
  Shield,
  CheckCircle,
  FileText,
  Download,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building,
  AlertTriangle,
  Bell
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateBankCertificate } from "@/utils/generateBankCertificate";
import { generateTransactionReceipt } from "@/utils/generateTransactionReceipt";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  country: string;
  nationality: string;
  full_address: string;
  birth_date: string;
  phone: string;
  account_type: string;
  id_document_number: string;
  account_number: string;
  routing_number: string;
  status: string;
  btc: number;
  eth: number;
  bnb: number;
  usdt: number;
  ltc: number;
  usd: number;
  created_at: string;
  updated_at: string;
  activation_amount: number;
  usdt_address: string;
  is_activated: boolean;
  proof_of_address_url: string;
  proof_of_address_type: string;
  show_fatca: boolean;
  show_activation_modal: boolean;
  show_custom_notification: boolean;
  custom_notification_title: string;
  custom_notification_message: string;
  custom_notification_amount: number;
  fatca_amount: number;
}

const cryptoPrices = {
  btc: 43300,
  eth: 1807,
  bnb: 250,
  usdt: 1,
  ltc: 70,
};

const cryptoOptions = [
  { value: 'usd', label: 'USD', symbol: '$', color: '#22C55E' },
  { value: 'usdt', label: 'USDT', symbol: 'T', color: '#26A17B' },
  { value: 'btc', label: 'BTC', symbol: 'B', color: '#F7931A' },
  { value: 'eth', label: 'ETH', symbol: 'E', color: '#627EEA' },
  { value: 'bnb', label: 'BNB', symbol: 'B', color: '#F3BA2F' },
  { value: 'ltc', label: 'LTC', symbol: 'L', color: '#345D9D' },
];

const idDocumentTypeLabels: Record<string, string> = {
  passport: 'Pasaporte',
  national_id: 'Cédula de identidad',
  drivers_license: 'Licencia de conducir',
  foreign_id: 'Carnet de extranjería',
};

const countryLabels: Record<string, string> = {
  US: 'Estados Unidos',
  CA: 'Canadá',
  MX: 'México',
  GT: 'Guatemala',
  SV: 'El Salvador',
  HN: 'Honduras',
  NI: 'Nicaragua',
  CR: 'Costa Rica',
  PA: 'Panamá',
  CU: 'Cuba',
  DO: 'República Dominicana',
  CO: 'Colombia',
  VE: 'Venezuela',
  EC: 'Ecuador',
  PE: 'Perú',
  BR: 'Brasil',
  BO: 'Bolivia',
  PY: 'Paraguay',
  UY: 'Uruguay',
  AR: 'Argentina',
  CL: 'Chile',
  ES: 'España',
  PT: 'Portugal',
  FR: 'Francia',
  IT: 'Italia',
  DE: 'Alemania',
  GB: 'Reino Unido',
};

const accountTypeLabels: Record<string, string> = {
  savings: 'Cuenta de Ahorros',
  checking: 'Cuenta de Cheques',
};

const proofOfAddressLabels: Record<string, string> = {
  water: 'Recibo de agua',
  electricity: 'Recibo de luz',
  gas: 'Recibo de gas',
  internet: 'Recibo de internet',
  rental_contract: 'Contrato arrendamiento',
  residence_letter: 'Carta de residencia',
};

const UsersManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [viewingUser, setViewingUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState("balances");
  const [isSaving, setIsSaving] = useState(false);
  
  const [editBalances, setEditBalances] = useState({
    btc: "",
    eth: "",
    bnb: "",
    usdt: "",
    ltc: "",
    usd: "",
  });

  const [activationSettings, setActivationSettings] = useState({
    activation_amount: "",
    usdt_address: "",
    is_activated: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    show_fatca: false,
    show_activation_modal: true,
    show_custom_notification: false,
    custom_notification_title: "",
    custom_notification_message: "",
    custom_notification_amount: 0,
  });

  const [fatcaAmountInput, setFatcaAmountInput] = useState<string>("1521.00");

  const [bankAccountData, setBankAccountData] = useState<{
    id: string;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    id_number: string;
    phone: string;
    address: string;
    country: string;
    is_verified: boolean;
  } | null>(null);
  const [isLoadingBankAccount, setIsLoadingBankAccount] = useState(false);
  const [transferRequests, setTransferRequests] = useState<any[]>([]);
  const [isLoadingTransferRequests, setIsLoadingTransferRequests] = useState(false);


  const [transactionDetails, setTransactionDetails] = useState({
    type: "deposit" as "deposit" | "withdrawal",
    crypto: "usdt",
    amount: "",
    usd_value: "",
    description: "",
    transaction_hash: "",
    issued_by: "",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-all-profiles');
      
      if (error) throw error;
      
      setUsers(data.profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotalUsd = (user: Profile) => {
    return (
      Number(user.btc) * cryptoPrices.btc +
      Number(user.eth) * cryptoPrices.eth +
      Number(user.bnb) * cryptoPrices.bnb +
      Number(user.usdt) * cryptoPrices.usdt +
      Number(user.ltc) * cryptoPrices.ltc +
      Number(user.usd)
    );
  };

  const handleViewUser = async (user: Profile) => {
    setViewingUser(user);
    setIsLoadingTransferRequests(true);
    setTransferRequests([]);
    try {
      const { data, error } = await supabase
        .from('transfer_requests')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTransferRequests(data || []);
    } catch (error) {
      console.error('Error fetching transfer requests:', error);
    } finally {
      setIsLoadingTransferRequests(false);
    }
  };

  const handleUpdateTransferRequest = async (id: string, status: string) => {
    try {
      const request = transferRequests.find(r => r.id === id);
      const { error } = await supabase
        .from('transfer_requests')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      setTransferRequests(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));

      if ((status === 'approved' || status === 'rejected') && request) {
        try {
          await supabase.functions.invoke('update-user-balance', {
            body: {
              userId: request.user_id,
              transfer_request_review: {
                request_id: request.id,
                status,
                bank_name: request.bank_name,
                account_number: request.account_number,
                amount: request.amount,
                currency: request.currency || 'USD',
              },
            },
          });
        } catch (emailError) {
          console.error('Error sending transfer request notification:', emailError);
        }
        if (status === 'approved') {
          await fetchUsers();
        }
      }
      toast({
        title: "Solicitud actualizada",
        description: status === 'approved' ? "La solicitud fue aprobada." : status === 'rejected' ? "La solicitud fue rechazada." : "Estado actualizado.",
      });
    } catch (error) {
      console.error('Error updating transfer request:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la solicitud.",
        variant: "destructive",
      });
    }
  };


  const handleEditUser = async (user: Profile) => {
    setEditingUser(user);
    setActiveTab("transaction");
    setEditBalances({
      btc: String(user.btc),
      eth: String(user.eth),
      bnb: String(user.bnb),
      usdt: String(user.usdt),
      ltc: String(user.ltc),
      usd: String(user.usd),
    });
    setActivationSettings({
      activation_amount: String(user.activation_amount || 0),
      usdt_address: user.usdt_address || "",
      is_activated: user.is_activated || false,
    });
    setNotificationSettings({
      show_fatca: user.show_fatca || false,
      show_activation_modal: user.show_activation_modal !== false,
      show_custom_notification: user.show_custom_notification || false,
      custom_notification_title: user.custom_notification_title || "",
      custom_notification_message: user.custom_notification_message || "",
      custom_notification_amount: (user as any).custom_notification_amount || 0,
    });
    setTransactionDetails({
      type: "deposit",
      crypto: "usdt",
      amount: "",
      usd_value: "",
      description: "",
      transaction_hash: "",
      issued_by: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
    });
    
    // Fetch bank account data
    setIsLoadingBankAccount(true);
    setBankAccountData(null);
    try {
      const { data, error } = await supabase
        .from('affiliated_bank_accounts')
        .select('*')
        .eq('user_id', user.user_id)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setBankAccountData({
          id: data.id,
          bank_name: data.bank_name,
          account_number: data.account_number,
          account_holder_name: data.account_holder_name,
          id_number: data.id_number,
          phone: data.phone,
          address: data.address,
          country: data.country || '',
          is_verified: data.is_verified,
        });
      }

      // Cargar monto FATCA actual del perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('fatca_amount')
        .eq('user_id', user.user_id)
        .single();
      
      if (profileData?.fatca_amount) {
        setFatcaAmountInput(String(profileData.fatca_amount));
      } else {
        setFatcaAmountInput("1521.00");
      }
    } catch (error) {
      console.error('Error fetching bank account:', error);
    } finally {
      setIsLoadingBankAccount(false);
    }
  };

  const handleGeneratePdf = (user: Profile) => {
    try {
      generateBankCertificate(user);
      toast({
        title: "PDF generado",
        description: "La constancia bancaria se ha descargado correctamente.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF.",
        variant: "destructive",
      });
    }
  };

  const handleSaveActivation = async () => {
    if (!editingUser) return;
    setIsSaving(true);

    try {
      const { error } = await supabase.functions.invoke('update-user-balance', {
        body: {
          userId: editingUser.user_id,
          activation: {
            activation_amount: parseFloat(activationSettings.activation_amount) || 0,
            usdt_address: activationSettings.usdt_address,
            is_activated: activationSettings.is_activated,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Configuración guardada",
        description: `La configuración de activación de ${editingUser.full_name} ha sido actualizada.`,
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating activation:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración de activación.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!editingUser) return;
    setIsSaving(true);

    try {
      // Save block flags + FATCA amount + custom notification fields
      const { error } = await supabase
        .from('profiles')
        .update({
          show_fatca: notificationSettings.show_fatca,
          show_activation_modal: notificationSettings.show_activation_modal,
          show_custom_notification: notificationSettings.show_custom_notification,
          custom_notification_title: notificationSettings.custom_notification_title || null,
          custom_notification_message: notificationSettings.custom_notification_message || null,
          custom_notification_amount: notificationSettings.custom_notification_amount || 0,
          fatca_amount: parseFloat(fatcaAmountInput) || 1521.00,
        })
        .eq('user_id', editingUser.user_id);

      if (error) throw error;

      // If activation block is selected, also save activation settings (amount + address)
      if (notificationSettings.show_activation_modal) {
        const { error: activationError } = await supabase.functions.invoke('update-user-balance', {
          body: {
            userId: editingUser.user_id,
            activation: {
              activation_amount: parseFloat(activationSettings.activation_amount) || 0,
              usdt_address: activationSettings.usdt_address,
              is_activated: activationSettings.is_activated,
            }
          }
        });
        if (activationError) throw activationError;
      }

      // If FATCA block selected, also save USDT address
      if (notificationSettings.show_fatca) {
        const { error: addrError } = await supabase.functions.invoke('update-user-balance', {
          body: {
            userId: editingUser.user_id,
            activation: {
              activation_amount: parseFloat(activationSettings.activation_amount) || 0,
              usdt_address: activationSettings.usdt_address,
              is_activated: activationSettings.is_activated,
            }
          }
        });
        if (addrError) throw addrError;
      }

      toast({
        title: "Bloqueos actualizados",
        description: `Los bloqueos de ${editingUser.full_name} han sido actualizados.`,
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los bloqueos.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBalances = async () => {
    if (!editingUser) return;
    setIsSaving(true);

    try {
      const { error } = await supabase.functions.invoke('update-user-balance', {
        body: {
          userId: editingUser.user_id,
          balances: {
            btc: parseFloat(editBalances.btc) || 0,
            eth: parseFloat(editBalances.eth) || 0,
            bnb: parseFloat(editBalances.bnb) || 0,
            usdt: parseFloat(editBalances.usdt) || 0,
            ltc: parseFloat(editBalances.ltc) || 0,
            usd: parseFloat(editBalances.usd) || 0,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Balances actualizados",
        description: `Los balances de ${editingUser.full_name} han sido actualizados correctamente.`,
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating balances:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los balances.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handleAddTransaction = async () => {
    if (!editingUser || !transactionDetails.amount || !transactionDetails.crypto) {
      toast({
        title: "Error",
        description: "Por favor completa el monto y la moneda.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);

    try {
      const amount = parseFloat(transactionDetails.amount);
      const crypto = transactionDetails.crypto;
      const currentBalance = Number(editingUser[crypto as keyof Profile]) || 0;
      
      const newBalance = transactionDetails.type === 'deposit' 
        ? currentBalance + amount 
        : currentBalance - amount;

      if (newBalance < 0) {
        toast({
          title: "Error",
          description: "El balance no puede ser negativo.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const usdValue = crypto === 'usd' 
        ? amount 
        : amount * (cryptoPrices[crypto as keyof typeof cryptoPrices] || 1);

      const transactionDate = new Date(`${transactionDetails.date}T${transactionDetails.time}:00`);

      const { error } = await supabase.functions.invoke('update-user-balance', {
        body: {
          userId: editingUser.user_id,
          balances: {
            [crypto]: newBalance,
          },
          transaction: {
            type: transactionDetails.type,
            crypto: crypto.toUpperCase(),
            amount: amount,
            usd_value: usdValue,
            description: transactionDetails.description,
            transaction_hash: transactionDetails.transaction_hash,
            created_at: transactionDate.toISOString(),
          }
        }
      });

      if (error) throw error;

      // Generate and download PDF receipt
      generateTransactionReceipt({
        type: transactionDetails.type,
        crypto: crypto.toUpperCase(),
        amount: amount,
        usd_value: usdValue,
        description: transactionDetails.description,
        transaction_hash: transactionDetails.transaction_hash,
        created_at: transactionDate.toISOString(),
        issued_by: transactionDetails.issued_by || undefined,
        user: {
          full_name: editingUser.full_name,
          email: editingUser.email,
          phone: editingUser.phone,
          account_number: editingUser.account_number,
          routing_number: editingUser.routing_number,
          country: editingUser.country,
        }
      });

      toast({
        title: "Transacción registrada",
        description: `Se ha registrado un ${transactionDetails.type === 'deposit' ? 'depósito' : 'retiro'} de ${amount} ${crypto.toUpperCase()} para ${editingUser.full_name}. Comprobante descargado.`,
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar la transacción.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (user: Profile, newStatus: string) => {
    try {
      const { error } = await supabase.functions.invoke('update-user-balance', {
        body: {
          userId: user.user_id,
          status: newStatus
        }
      });

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `El usuario ${user.full_name} ahora está ${newStatus === 'active' ? 'activo' : 'inactivo'}.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive",
      });
    }
  };

  const handleApproveBankAccount = async (approve: boolean) => {
    if (!bankAccountData || !editingUser) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('affiliated_bank_accounts')
        .update({ is_verified: approve })
        .eq('id', bankAccountData.id);
      
      if (error) throw error;

      // Si se aprueba, guardar el monto FATCA en el perfil del usuario
      if (approve && fatcaAmountInput) {
        await supabase
          .from('profiles')
          .update({ fatca_amount: parseFloat(fatcaAmountInput) || 1521.00 })
          .eq('user_id', editingUser.user_id);
      }
      
      setBankAccountData(prev => prev ? { ...prev, is_verified: approve } : null);

      // Notificar por correo al usuario el resultado de la revisión
      try {
        await supabase.functions.invoke('update-user-balance', {
          body: {
            userId: editingUser.user_id,
            bank_account_review: {
              status: approve ? 'approved' : 'rejected',
              bank_name: bankAccountData.bank_name,
              account_number: bankAccountData.account_number,
              reviewed_at: new Date().toISOString(),
            },
          },
        });
      } catch (emailError) {
        console.error('Error sending bank account notification:', emailError);
      }
      
      toast({
        title: approve ? "Cuenta Aprobada" : "Cuenta Rechazada",
        description: approve 
          ? `La cuenta bancaria de ${editingUser.full_name} ha sido aprobada con monto FATCA de $${parseFloat(fatcaAmountInput || '1521').toLocaleString('en-US', { minimumFractionDigits: 2 })} USD.`
          : `La cuenta bancaria de ${editingUser.full_name} ha sido rechazada.`,
      });
    } catch (error) {
      console.error('Error updating bank account:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cuenta bancaria.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      inactive: "bg-red-500/10 text-red-500 border-red-500/20",
      pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    };
    const labels = {
      active: "Activo",
      inactive: "Inactivo",
      pending: "Pendiente",
    };
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles] || styles.pending}>
        {labels[status as keyof typeof labels] || "Pendiente"}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const selectedCrypto = cryptoOptions.find(c => c.value === transactionDetails.crypto);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administra las cuentas de usuarios registrados</p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o email..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <UserCheck className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Sin usuarios</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {searchTerm ? "No se encontraron usuarios con ese criterio de búsqueda." : "Aún no hay usuarios registrados. Los nuevos registros aparecerán aquí."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">País</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">No. Cuenta</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estado</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Bloqueo</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Balance Total</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Registro</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <span className="text-accent font-semibold text-sm">
                              {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-foreground">{countryLabels[user.country] || user.country}</td>
                      <td className="p-4 text-foreground font-mono text-sm">{user.account_number || '-'}</td>
                      <td className="p-4">{getStatusBadge(user.status)}</td>
                      <td className="p-4">
                        {user.show_activation_modal && !user.is_activated ? (
                          <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10 text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Activación
                          </Badge>
                        ) : user.show_fatca ? (
                          <Badge variant="outline" className="border-red-500/50 text-red-500 bg-red-500/10 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            FATCA
                          </Badge>
                        ) : user.show_custom_notification ? (
                          <Badge variant="outline" className="border-purple-500/50 text-purple-500 bg-purple-500/10 text-xs">
                            <Bell className="w-3 h-3 mr-1" />
                            Personalizado
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Ninguno</span>
                        )}
                      </td>
                      <td className="p-4 text-foreground font-medium">
                        ${calculateTotalUsd(user).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">{formatDate(user.created_at)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                            onClick={() => handleViewUser(user)}
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10"
                            onClick={() => handleEditUser(user)}
                            title="Gestionar balances"
                          >
                            <Wallet className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                            onClick={() => handleGeneratePdf(user)}
                            title="Generar constancia PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border">
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => handleViewUser(user)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-accent cursor-pointer"
                                onClick={() => handleEditUser(user)}
                              >
                                <Wallet className="w-4 h-4 mr-2" />
                                Agregar Transacción
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-emerald-500 cursor-pointer"
                                onClick={() => handleGeneratePdf(user)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Descargar Constancia
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => handleUpdateStatus(user, 'active')}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => handleUpdateStatus(user, 'inactive')}
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Desactivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Details Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {viewingUser && (
                <>
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-semibold">
                      {viewingUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg">{viewingUser.full_name}</p>
                    <p className="text-sm text-muted-foreground font-normal">{viewingUser.email}</p>
                  </div>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Información de la cuenta y solicitudes bancarias del usuario.
            </DialogDescription>
          </DialogHeader>
          
          {viewingUser && (
            <div className="space-y-6 mt-4">
              {/* Solicitudes de transferencia */}
              <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Solicitudes de Transferencia a su Banco
                </h3>
                {isLoadingTransferRequests ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando solicitudes...
                  </div>
                ) : transferRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Este usuario todavía no ha enviado una solicitud desde “Transferir a mi banco”.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transferRequests.map((req) => (
                      <div key={req.id} className="p-4 bg-background rounded-lg border border-border space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-lg">
                              ${Number(req.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {req.currency}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(req.created_at)}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              req.status === 'approved'
                                ? 'text-emerald-500 border-emerald-500/30'
                                : req.status === 'rejected'
                                ? 'text-red-500 border-red-500/30'
                                : 'text-amber-500 border-amber-500/30'
                            }
                          >
                            {req.status === 'approved' ? 'Aprobada' : req.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Banco destino</p>
                            <p className="text-sm font-medium">{req.bank_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Cuenta</p>
                            <p className="text-sm font-mono">{req.account_number}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Titular</p>
                            <p className="text-sm">{req.account_holder_name}</p>
                          </div>
                        </div>
                        {req.status === 'pending' && (
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" className="flex-1" onClick={() => handleUpdateTransferRequest(req.id, 'approved')}>
                              Aprobar
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleUpdateTransferRequest(req.id, 'rejected')}>
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Nombre completo</p>
                    <p className="font-medium">{viewingUser.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de nacimiento</p>
                    <p className="font-medium">{viewingUser.birth_date || 'No especificada'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nacionalidad</p>
                    <p className="font-medium">{countryLabels[viewingUser.nationality] || viewingUser.nationality || 'No especificada'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">País de residencia</p>
                    <p className="font-medium">{countryLabels[viewingUser.country] || viewingUser.country || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">No. de identificación</p>
                    <p className="font-medium font-mono">{viewingUser.id_document_number || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{viewingUser.phone || 'No especificado'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Dirección completa</p>
                    <p className="font-medium">{viewingUser.full_address || 'No especificada'}</p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Información de Cuenta
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo de cuenta</p>
                    <p className="font-medium">{accountTypeLabels[viewingUser.account_type] || 'Cuenta de Ahorros'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    {getStatusBadge(viewingUser.status)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Número de cuenta</p>
                    <p className="font-medium font-mono text-lg">{viewingUser.account_number || 'No asignado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Número de ruta (Routing)</p>
                    <p className="font-medium font-mono text-lg">{viewingUser.routing_number || 'No asignado'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de registro</p>
                    <p className="font-medium">{formatDate(viewingUser.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Última actualización</p>
                    <p className="font-medium">{formatDate(viewingUser.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documentos
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Comprobante de domicilio</p>
                    <p className="font-medium">{proofOfAddressLabels[viewingUser.proof_of_address_type] || 'No especificado'}</p>
                    {viewingUser.proof_of_address_url && (
                      <Badge variant="outline" className="mt-1 text-emerald-500 border-emerald-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Documento cargado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Balances */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Balances
                </h3>
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground">USD</p>
                    <p className="font-bold text-lg">${Number(viewingUser.usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground">BTC</p>
                    <p className="font-bold text-lg">{Number(viewingUser.btc).toFixed(6)}</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground">ETH</p>
                    <p className="font-bold text-lg">{Number(viewingUser.eth).toFixed(4)}</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground">USDT</p>
                    <p className="font-bold text-lg">{Number(viewingUser.usdt).toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground">BNB</p>
                    <p className="font-bold text-lg">{Number(viewingUser.bnb).toFixed(4)}</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground">LTC</p>
                    <p className="font-bold text-lg">{Number(viewingUser.ltc).toFixed(4)}</p>
                  </div>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm text-muted-foreground">Balance Total Estimado</p>
                  <p className="font-bold text-2xl text-accent">
                    ${calculateTotalUsd(viewingUser).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setViewingUser(null);
                    handleEditUser(viewingUser);
                  }}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Gestionar Balances
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGeneratePdf(viewingUser)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Constancia
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {editingUser && (
                <>
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-semibold text-sm">
                      {editingUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p>{editingUser.full_name}</p>
                    <p className="text-sm text-muted-foreground font-normal">{editingUser.email}</p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="transaction">Transacción</TabsTrigger>
                <TabsTrigger value="balances">Balances</TabsTrigger>
                <TabsTrigger value="bank">Cta. Banco</TabsTrigger>
                <TabsTrigger value="activation">Activación</TabsTrigger>
                <TabsTrigger value="notifications">Bloqueos</TabsTrigger>
              </TabsList>
              
              {/* Transaction Tab */}
              <TabsContent value="transaction" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={transactionDetails.type === 'deposit' ? 'default' : 'outline'}
                    className={transactionDetails.type === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    onClick={() => setTransactionDetails(prev => ({ ...prev, type: 'deposit' }))}
                  >
                    <ArrowDownLeft className="w-4 h-4 mr-2" />
                    Depósito
                  </Button>
                  <Button
                    type="button"
                    variant={transactionDetails.type === 'withdrawal' ? 'default' : 'outline'}
                    className={transactionDetails.type === 'withdrawal' ? 'bg-red-600 hover:bg-red-700' : ''}
                    onClick={() => setTransactionDetails(prev => ({ ...prev, type: 'withdrawal' }))}
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Retiro
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Moneda</Label>
                    <Select 
                      value={transactionDetails.crypto}
                      onValueChange={(value) => setTransactionDetails(prev => ({ ...prev, crypto: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cryptoOptions.map(crypto => (
                          <SelectItem key={crypto.value} value={crypto.value}>
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: crypto.color }}
                              >
                                {crypto.symbol}
                              </span>
                              {crypto.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Monto</Label>
                    <div className="relative">
                      <Input 
                        type="number"
                        step="0.0001"
                        placeholder="0.00"
                        value={transactionDetails.amount}
                        onChange={(e) => setTransactionDetails(prev => ({ ...prev, amount: e.target.value }))}
                      />
                      {selectedCrypto && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          {selectedCrypto.label}
                        </span>
                      )}
                    </div>
                    {transactionDetails.amount && transactionDetails.crypto !== 'usd' && (
                      <p className="text-xs text-muted-foreground">
                        ≈ ${((parseFloat(transactionDetails.amount) || 0) * (cryptoPrices[transactionDetails.crypto as keyof typeof cryptoPrices] || 1)).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Fecha
                    </Label>
                    <Input 
                      type="date"
                      value={transactionDetails.date}
                      onChange={(e) => setTransactionDetails(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Hora
                    </Label>
                    <Input 
                      type="time"
                      value={transactionDetails.time}
                      onChange={(e) => setTransactionDetails(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Hash de Transacción (opcional)
                  </Label>
                  <Input 
                    placeholder="0x..."
                    value={transactionDetails.transaction_hash}
                    onChange={(e) => setTransactionDetails(prev => ({ ...prev, transaction_hash: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Emitido por (opcional)
                  </Label>
                  <Input 
                    placeholder="Nombre del emisor..."
                    value={transactionDetails.issued_by}
                    onChange={(e) => setTransactionDetails(prev => ({ ...prev, issued_by: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Descripción (opcional)</Label>
                  <Textarea 
                    placeholder="Descripción de la transacción..."
                    value={transactionDetails.description}
                    onChange={(e) => setTransactionDetails(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">
                    Balance actual de {selectedCrypto?.label}: <span className="font-semibold text-foreground">{Number(editingUser[transactionDetails.crypto as keyof Profile] || 0).toFixed(4)} {selectedCrypto?.label}</span>
                  </p>
                  {transactionDetails.amount && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Nuevo balance: <span className={`font-semibold ${transactionDetails.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {(transactionDetails.type === 'deposit' 
                          ? Number(editingUser[transactionDetails.crypto as keyof Profile] || 0) + parseFloat(transactionDetails.amount)
                          : Number(editingUser[transactionDetails.crypto as keyof Profile] || 0) - parseFloat(transactionDetails.amount)
                        ).toFixed(4)} {selectedCrypto?.label}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddTransaction} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Registrar Transacción
                  </Button>
                </div>
              </TabsContent>

              {/* Balances Tab */}
              <TabsContent value="balances" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center text-white text-xs font-bold">$</span>
                      USD
                    </Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={editBalances.usd}
                      onChange={(e) => setEditBalances(prev => ({ ...prev, usd: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#F7931A] flex items-center justify-center text-white text-xs font-bold">B</span>
                      BTC
                    </Label>
                    <Input 
                      type="number"
                      step="0.0001"
                      value={editBalances.btc}
                      onChange={(e) => setEditBalances(prev => ({ ...prev, btc: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      ≈ ${((parseFloat(editBalances.btc) || 0) * cryptoPrices.btc).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#627EEA] flex items-center justify-center text-white text-xs font-bold">E</span>
                      ETH
                    </Label>
                    <Input 
                      type="number"
                      step="0.0001"
                      value={editBalances.eth}
                      onChange={(e) => setEditBalances(prev => ({ ...prev, eth: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      ≈ ${((parseFloat(editBalances.eth) || 0) * cryptoPrices.eth).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#F3BA2F] flex items-center justify-center text-white text-xs font-bold">B</span>
                      BNB
                    </Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={editBalances.bnb}
                      onChange={(e) => setEditBalances(prev => ({ ...prev, bnb: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      ≈ ${((parseFloat(editBalances.bnb) || 0) * cryptoPrices.bnb).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#26A17B] flex items-center justify-center text-white text-xs font-bold">T</span>
                      USDT
                    </Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={editBalances.usdt}
                      onChange={(e) => setEditBalances(prev => ({ ...prev, usdt: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      ≈ ${((parseFloat(editBalances.usdt) || 0) * cryptoPrices.usdt).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#345D9D] flex items-center justify-center text-white text-xs font-bold">L</span>
                      LTC
                    </Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={editBalances.ltc}
                      onChange={(e) => setEditBalances(prev => ({ ...prev, ltc: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      ≈ ${((parseFloat(editBalances.ltc) || 0) * cryptoPrices.ltc).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">Balance Total Estimado:</span>
                    <span className="text-xl font-bold text-foreground">
                      ${(
                        (parseFloat(editBalances.usd) || 0) +
                        (parseFloat(editBalances.btc) || 0) * cryptoPrices.btc +
                        (parseFloat(editBalances.eth) || 0) * cryptoPrices.eth +
                        (parseFloat(editBalances.bnb) || 0) * cryptoPrices.bnb +
                        (parseFloat(editBalances.usdt) || 0) * cryptoPrices.usdt +
                        (parseFloat(editBalances.ltc) || 0) * cryptoPrices.ltc
                      ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isSaving}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveBalances} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Guardar Balances
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Bank Account Tab */}
              <TabsContent value="bank" className="space-y-4 mt-4">
                {isLoadingBankAccount ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !bankAccountData ? (
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Este usuario no ha registrado una cuenta bancaria.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">Cuenta Bancaria Afiliada</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={bankAccountData.is_verified 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }
                        >
                          {bankAccountData.is_verified ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Aprobada</>
                          ) : (
                            'Pendiente de Aprobación'
                          )}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">Banco</p>
                        <p className="font-medium">{bankAccountData.bank_name}</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">Número de Cuenta</p>
                        <p className="font-medium font-mono">{bankAccountData.account_number}</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">Titular de la Cuenta</p>
                        <p className="font-medium">{bankAccountData.account_holder_name}</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">No. de Identificación</p>
                        <p className="font-medium font-mono">{bankAccountData.id_number}</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">Teléfono</p>
                        <p className="font-medium">{bankAccountData.phone}</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">País</p>
                        <p className="font-medium">{countryLabels[bankAccountData.country] || bankAccountData.country || 'No especificado'}</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg col-span-2">
                        <p className="text-xs text-muted-foreground">Dirección</p>
                        <p className="font-medium">{bankAccountData.address}</p>
                      </div>
                    </div>

                    {/* FATCA Amount field - only shown when FATCA block is selected in Bloqueos tab */}
                    {notificationSettings.show_fatca && (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Monto de solicitud FATCA</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Define el monto FATCA que se mostrará al usuario al intentar transferir a esta cuenta bancaria. Es obligatorio para aprobar la cuenta.
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="1521.00"
                            value={fatcaAmountInput}
                            onChange={(e) => setFatcaAmountInput(e.target.value)}
                            className="font-mono"
                          />
                          <span className="text-muted-foreground text-sm whitespace-nowrap">USD</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                      <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isSaving}>
                        Cancelar
                      </Button>
                      {!bankAccountData.is_verified ? (
                        <>
                          <Button 
                            variant="outline"
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => handleApproveBankAccount(false)} 
                            disabled={isSaving}
                          >
                            Rechazar
                          </Button>
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleApproveBankAccount(true)} 
                            disabled={isSaving || (notificationSettings.show_fatca && (!fatcaAmountInput || parseFloat(fatcaAmountInput) <= 0))}
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Aprobar Cuenta
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline"
                          className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                          onClick={() => handleApproveBankAccount(false)} 
                          disabled={isSaving}
                        >
                          Revocar Aprobación
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Activation Tab */}
              <TabsContent value="activation" className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Estado de Activación</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={activationSettings.is_activated 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }
                    >
                      {activationSettings.is_activated ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Activada</>
                      ) : (
                        'Pendiente'
                      )}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant={activationSettings.is_activated ? 'default' : 'outline'}
                      className={activationSettings.is_activated ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      onClick={() => setActivationSettings(prev => ({ ...prev, is_activated: true }))}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Activar
                    </Button>
                    <Button
                      type="button"
                      variant={!activationSettings.is_activated ? 'default' : 'outline'}
                      className={!activationSettings.is_activated ? 'bg-amber-600 hover:bg-amber-700' : ''}
                      onClick={() => setActivationSettings(prev => ({ ...prev, is_activated: false }))}
                    >
                      Desactivar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Monto de Activación (USD)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={activationSettings.activation_amount}
                    onChange={(e) => setActivationSettings(prev => ({ ...prev, activation_amount: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Monto requerido para activar la cuenta del usuario
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Dirección USDT para Activación</Label>
                  <Input 
                    placeholder="0x..."
                    value={activationSettings.usdt_address}
                    onChange={(e) => setActivationSettings(prev => ({ ...prev, usdt_address: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Dirección donde el usuario debe enviar el pago de activación
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveActivation} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Guardar Configuración
                  </Button>
                </div>
              </TabsContent>

              {/* Bloqueos Tab */}
              <TabsContent value="notifications" className="space-y-4 mt-4">
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Tipo de bloqueo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecciona qué tipo de bloqueo verá el usuario al intentar retirar o transferir fondos. Solo puede haber un bloqueo activo a la vez. Cada bloqueo permite configurar un monto y mensaje personalizado.
                  </p>
                </div>

                {/* Radio: Sin bloqueo */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    !notificationSettings.show_activation_modal && !notificationSettings.show_fatca && !notificationSettings.show_custom_notification
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-muted/30 border-border hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setNotificationSettings(prev => ({ ...prev, show_activation_modal: false, show_fatca: false, show_custom_notification: false }))}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      !notificationSettings.show_activation_modal && !notificationSettings.show_fatca && !notificationSettings.show_custom_notification
                        ? 'border-emerald-500' : 'border-muted-foreground/40'
                    }`}>
                      {!notificationSettings.show_activation_modal && !notificationSettings.show_fatca && !notificationSettings.show_custom_notification && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Sin bloqueo</p>
                      <p className="text-sm text-muted-foreground">El usuario puede retirar y transferir sin restricciones.</p>
                    </div>
                  </div>
                </div>

                {/* Radio: Activación (Onboarding Fee) */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    notificationSettings.show_activation_modal
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-muted/30 border-border hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setNotificationSettings(prev => ({ ...prev, show_activation_modal: true, show_fatca: false, show_custom_notification: false }))}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      notificationSettings.show_activation_modal ? 'border-amber-500' : 'border-muted-foreground/40'
                    }`}>
                      {notificationSettings.show_activation_modal && (
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Bloqueo por Activación de Cuenta (Onboarding Fee)</p>
                      <p className="text-sm text-muted-foreground">Bloquea retiros hasta que el usuario complete el pago de activación.</p>
                    </div>
                  </div>
                </div>

                {notificationSettings.show_activation_modal && (
                  <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-border ml-7">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Monto de Activación (USD)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={activationSettings.activation_amount}
                          onChange={(e) => setActivationSettings(prev => ({ ...prev, activation_amount: e.target.value }))}
                          className="font-mono"
                        />
                        <span className="text-muted-foreground text-sm whitespace-nowrap">USD</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Monto requerido para activar la cuenta del usuario.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Dirección USDT para pago</Label>
                      <Input
                        placeholder="Dirección USDT TRC-20..."
                        value={activationSettings.usdt_address}
                        onChange={(e) => setActivationSettings(prev => ({ ...prev, usdt_address: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Dirección donde el usuario debe enviar el pago de activación.
                      </p>
                    </div>
                  </div>
                )}

                {/* Radio: FATCA */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    notificationSettings.show_fatca
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-muted/30 border-border hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setNotificationSettings(prev => ({ ...prev, show_activation_modal: false, show_fatca: true, show_custom_notification: false }))}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      notificationSettings.show_fatca ? 'border-amber-500' : 'border-muted-foreground/40'
                    }`}>
                      {notificationSettings.show_fatca && (
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Bloqueo por Cumplimiento FATCA</p>
                      <p className="text-sm text-muted-foreground">Bloquea retiros mostrando solicitud de pago FATCA.</p>
                    </div>
                  </div>
                </div>

                {notificationSettings.show_fatca && (
                  <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-border ml-7">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Monto FATCA (USD)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1521.00"
                          value={fatcaAmountInput}
                          onChange={(e) => setFatcaAmountInput(e.target.value)}
                          className="font-mono"
                        />
                        <span className="text-muted-foreground text-sm whitespace-nowrap">USD</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Este monto se mostrará al usuario como requisito de pago FATCA.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Dirección USDT para pago FATCA</Label>
                      <Input
                        placeholder="Dirección USDT TRC-20..."
                        value={activationSettings.usdt_address}
                        onChange={(e) => setActivationSettings(prev => ({ ...prev, usdt_address: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Dirección donde el usuario debe enviar el pago FATCA.
                      </p>
                    </div>
                  </div>
                )}

                {/* Radio: Aviso personalizado */}
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    notificationSettings.show_custom_notification
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-muted/30 border-border hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setNotificationSettings(prev => ({ ...prev, show_activation_modal: false, show_fatca: false, show_custom_notification: true }))}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      notificationSettings.show_custom_notification ? 'border-amber-500' : 'border-muted-foreground/40'
                    }`}>
                      {notificationSettings.show_custom_notification && (
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Bloqueo por Aviso Personalizado</p>
                      <p className="text-sm text-muted-foreground">Bloquea retiros mostrando un mensaje personalizado con monto opcional.</p>
                    </div>
                  </div>
                </div>

                {notificationSettings.show_custom_notification && (
                  <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-border ml-7">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Título del bloqueo</Label>
                      <Input
                        placeholder="Ej: Verificación pendiente"
                        value={notificationSettings.custom_notification_title}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, custom_notification_title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Monto de pago (USD)</Label>
                      <Input
                        type="number"
                        placeholder="Ej: 500.00"
                        value={notificationSettings.custom_notification_amount || ""}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, custom_notification_amount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Motivo / Mensaje</Label>
                      <Textarea
                        placeholder="Escribe el motivo del bloqueo que verá el usuario..."
                        rows={3}
                        value={notificationSettings.custom_notification_message}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, custom_notification_message: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveNotifications} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Guardar Bloqueos
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;


