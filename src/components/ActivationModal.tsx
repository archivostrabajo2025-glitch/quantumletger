import { useEffect, useState } from "react";
import { AlertTriangle, Copy, Check, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";

interface ActivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileData {
  activation_amount: number;
  usdt_address: string;
  is_activated: boolean;
}

export const ActivationModal = ({ open, onOpenChange }: ActivationModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!open) return;
      
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('activation_amount, usdt_address, is_activated')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfileData(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [open]);

  const handleCopyAddress = async () => {
    if (!profileData?.usdt_address) return;
    
    try {
      await navigator.clipboard.writeText(profileData.usdt_address);
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

  if (isLoading) {
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

  // Si ya está activada, mostrar mensaje diferente
  if (profileData?.is_activated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Wallet className="w-5 h-5 text-emerald-500" />
              Cuenta Activada
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tu cuenta ya está activada. Puedes realizar transferencias bancarias.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Continuar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Onboarding Fee
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            La Onboarding Fee garantiza que el proceso de registro y activación se realice de forma segura, legal y operativa, cubriendo los costos reales de validación, configuración y gestión inicial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Monto requerido */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Monto de activación requerido</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {profileData?.activation_amount?.toLocaleString() || 0} USDT
            </p>
          </div>

          {/* QR Code */}
          {profileData?.usdt_address && (
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG 
                  value={profileData.usdt_address} 
                  size={180}
                  level="H"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Escanea el código QR o copia la dirección
              </p>
            </div>
          )}

          {/* Dirección USDT */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Dirección USDT (TRC-20)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-xs break-all text-foreground">
                {profileData?.usdt_address || "No configurada"}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyAddress}
                disabled={!profileData?.usdt_address}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium text-foreground">Instrucciones:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Realiza un depósito del monto indicado a la dirección USDT TRC-20</li>
              <li>Espera la confirmación de la red (aprox. 5-10 minutos)</li>
              <li>Tu cuenta será activada automáticamente</li>
            </ol>
          </div>
        </div>

        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
          Entendido
        </Button>
      </DialogContent>
    </Dialog>
  );
};
