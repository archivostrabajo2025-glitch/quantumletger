import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, AlertTriangle, Copy, Check, ArrowRight, Loader2, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { BankAccountModal } from "./BankAccountModal";

interface TransferToBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount?: string;
  currency?: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  is_verified: boolean;
}

export const TransferToBankModal = ({ 
  open, 
  onOpenChange, 
  amount = "0", 
  currency = "USD" 
}: TransferToBankModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [showFatcaNotice, setShowFatcaNotice] = useState(false);
  const [fatcaEnabled, setFatcaEnabled] = useState(false);
  const [fatcaAmount, setFatcaAmount] = useState<number>(1521.00);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [usdtAddress, setUsdtAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [transferAmount, setTransferAmount] = useState(amount);
  const [isActivated, setIsActivated] = useState(false);
  const [showCustomNotification, setShowCustomNotification] = useState(false);
  const [showActivationBlock, setShowActivationBlock] = useState(false);
  const [activationBlocked, setActivationBlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);



  useEffect(() => {
    const fetchData = async () => {
      if (!open) return;
      
      setIsLoading(true);
      setShowFatcaNotice(false);
      setActivationBlocked(false);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Obtener cuentas bancarias afiliadas
        const { data: accounts, error } = await supabase
          .from('affiliated_bank_accounts')
          .select('id, bank_name, account_number, account_holder_name, is_verified')
          .eq('user_id', user.id);

        if (error) throw error;
        
        setBankAccounts(accounts || []);
        
        // Seleccionar la primera cuenta verificada por defecto
        const verifiedAccount = accounts?.find(a => a.is_verified);
        if (verifiedAccount) {
          setSelectedAccountId(verifiedAccount.id);
        } else if (accounts && accounts.length > 0) {
          setSelectedAccountId(accounts[0].id);
        }

        // Obtener dirección USDT y flags FATCA del perfil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('usdt_address, show_fatca, fatca_amount, is_activated, show_custom_notification, show_activation_modal')
          .eq('user_id', user.id)
          .single();

        if (profileData?.usdt_address) {
          setUsdtAddress(profileData.usdt_address);
        }
        setFatcaEnabled(profileData?.show_fatca || false);
        setFatcaAmount(profileData?.fatca_amount || 1521.00);
        setIsActivated(profileData?.is_activated || false);
        setShowCustomNotification(profileData?.show_custom_notification || false);
        // Solo mostrar bloqueo de activación si el admin lo habilitó explícitamente
        setShowActivationBlock(profileData?.show_activation_modal === true && profileData?.is_activated !== true);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    setTransferAmount(amount);
  }, [open, amount]);

  const handleCopyAddress = async () => {
    if (!usdtAddress) return;
    
    try {
      await navigator.clipboard.writeText(usdtAddress);
      setCopied(true);
      toast({
        title: "Dirección copiada",
        description: "La dirección USDT TRC-20 ha sido copiada al portapapeles.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar la dirección.",
        variant: "destructive",
      });
    }
  };

  const handleTransfer = async () => {
    if (showCustomNotification) {
      toast({
        title: "Aviso pendiente",
        description: "Tienes un aviso pendiente que impide realizar transferencias.",
        variant: "destructive",
      });
      return;
    }

    const selectedAccount = bankAccounts.find(a => a.id === selectedAccountId);
    
    if (!selectedAccount) {
      toast({
        title: "Error",
        description: "Por favor selecciona una cuenta bancaria.",
        variant: "destructive",
      });
      return;
    }

    // Cuenta pendiente de aprobación: la transferencia se registra igual,
    // pero queda en revisión hasta que el banco apruebe la cuenta.
    const accountPending = !selectedAccount.is_verified;

    const parsedAmount = Number(String(transferAmount).replace(/,/g, "")) || 0;

    if (parsedAmount <= 0) {
      toast({
        title: "Monto inválido",
        description: "Ingresa un monto mayor a cero.",
        variant: "destructive",
      });
      return;
    }

    // Registrar la solicitud para que el administrador pueda verla
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: insertError } = await supabase
          .from('transfer_requests')
          .insert({
            user_id: user.id,
            bank_account_id: selectedAccount.id,
            bank_name: selectedAccount.bank_name,
            account_number: selectedAccount.account_number,
            account_holder_name: selectedAccount.account_holder_name,
            amount: parsedAmount,
            currency,
            status: 'pending',
            notes: showActivationBlock
              ? 'Cuenta pendiente de activación'
              : fatcaEnabled
                ? 'Cumplimiento FATCA pendiente'
                : accountPending
                  ? 'Cuenta bancaria pendiente de aprobación'
                  : null,
          });
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error saving transfer request:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);

    if (showActivationBlock) {
      setActivationBlocked(true);
      return;
    }

    // Mostrar aviso FATCA solo si el admin lo habilitó
    if (fatcaEnabled) {
      setShowFatcaNotice(true);
    } else if (accountPending) {
      toast({
        title: "Transacción en revisión",
        description: "Tu transferencia quedó en revisión y será procesada cuando tu cuenta bancaria sea aprobada.",
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de transferencia ha sido registrada.",
      });
      onOpenChange(false);
    }
  };



  const handleBankAccountModalClose = (isOpen: boolean) => {
    setShowBankAccountModal(isOpen);
    if (!isOpen) {
      // Refrescar lista de cuentas
      const fetchAccounts = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: accounts } = await supabase
          .from('affiliated_bank_accounts')
          .select('id, bank_name, account_number, account_holder_name, is_verified')
          .eq('user_id', user.id);

        setBankAccounts(accounts || []);
        if (accounts && accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accounts[0].id);
        }
      };
      fetchAccounts();
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Mostrar bloqueo de activación
  if (activationBlocked) {

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Lock className="w-5 h-5 text-amber-500" />
              Cuenta no activada
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tu cuenta debe estar activada para realizar transferencias
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Para realizar transferencias a tu banco, primero debes completar el proceso de activación (<strong>Onboarding Fee</strong>).
            </p>
            <Button 
              onClick={() => {
                onOpenChange(false);
                navigate("/dashboard");
              }}
              className="mt-2"
            >
              Ver activación
            </Button>
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cerrar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Mostrar aviso FATCA
  if (showFatcaNotice) {
    const selectedAccount = bankAccounts.find(a => a.id === selectedAccountId);
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Cumplimiento FATCA
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Foreign Account Tax Compliance Act
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Resumen de transferencia */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Transferencia a</p>
              <p className="text-sm font-medium text-foreground">{selectedAccount?.bank_name}</p>
              <p className="text-xs text-muted-foreground font-mono">{selectedAccount?.account_number}</p>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Pago requerido por cumplimiento FATCA</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${fatcaAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg space-y-2">
              <p className="text-sm text-foreground">
                Para cumplir con las regulaciones FATCA (Foreign Account Tax Compliance Act), 
                se requiere realizar un pago de verificación antes de procesar transferencias internacionales.
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Al efectuar el pago solicitado, en un plazo no mayor a 10 minutos se reflejarán los fondos en su cuenta bancaria.
              </p>
            </div>

            {/* QR Code */}
            {usdtAddress && (
              <div className="flex flex-col items-center space-y-3">
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG 
                    value={usdtAddress} 
                    size={160}
                    level="H"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Escanea el código QR o copia la dirección
                </p>
              </div>
            )}

            {/* Dirección USDT */}
            {usdtAddress && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Dirección USDT (TRC-20)</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-xs break-all text-foreground">
                    {usdtAddress}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyAddress}
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Si no tiene cuentas, mostrar opción de agregar
  if (bankAccounts.length === 0) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Building2 className="w-5 h-5 text-primary" />
                Transferir a mi Banco
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                No tienes cuentas bancarias registradas
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Para realizar transferencias a tu banco, primero debes inscribir una cuenta bancaria.
              </p>
              <Button onClick={() => setShowBankAccountModal(true)} className="w-full">
                Inscribir Cuenta Bancaria
              </Button>
            </div>

            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Cancelar
            </Button>
          </DialogContent>
        </Dialog>

        <BankAccountModal 
          open={showBankAccountModal} 
          onOpenChange={handleBankAccountModalClose} 
        />
      </>
    );
  }

  // Formulario de transferencia
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="w-5 h-5 text-primary" />
              Transferir a mi Banco
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Selecciona la cuenta destino para tu transferencia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Monto a transferir */}
            <div className="space-y-2">
              <Label className="text-foreground">Monto a transferir</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="flex-1 bg-background border-border"
                  placeholder="0.00"
                />
                <div className="px-4 py-2 bg-muted rounded-md flex items-center">
                  <span className="text-sm font-medium text-foreground">{currency}</span>
                </div>
              </div>
            </div>

            {/* Selector de cuenta */}
            <div className="space-y-2">
              <Label className="text-foreground">Cuenta destino</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue placeholder="Selecciona una cuenta" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <span>{account.bank_name}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-mono text-xs">
                          ****{account.account_number.slice(-4)}
                        </span>
                        {!account.is_verified && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/10 text-amber-600 rounded">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Detalles de la cuenta seleccionada */}
            {selectedAccountId && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                {(() => {
                  const selected = bankAccounts.find(a => a.id === selectedAccountId);
                  if (!selected) return null;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Banco</span>
                        <span className="text-sm font-medium text-foreground">{selected.bank_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Cuenta</span>
                        <span className="text-sm font-mono text-foreground">{selected.account_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Titular</span>
                        <span className="text-sm text-foreground">{selected.account_holder_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Estado</span>
                        {selected.is_verified ? (
                          <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-500 rounded-full">
                            Verificada
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-600 rounded-full">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Botón agregar otra cuenta */}
            <Button 
              variant="ghost" 
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowBankAccountModal(true)}
            >
              + Inscribir otra cuenta bancaria
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleTransfer} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Transferir
            </Button>

          </div>
        </DialogContent>
      </Dialog>

      <BankAccountModal 
        open={showBankAccountModal} 
        onOpenChange={handleBankAccountModalClose} 
      />
    </>
  );
};
