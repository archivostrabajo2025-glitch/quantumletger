import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Save, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BankAccountData {
  id?: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  id_number: string;
  phone: string;
  address: string;
  country: string;
  is_verified: boolean;
}

type BlockType = 'none' | 'activation' | 'fatca' | 'custom';

const UserBankAccountPage = () => {
  const [activeBlock, setActiveBlock] = useState<BlockType>('none');
  const [customNotificationTitle, setCustomNotificationTitle] = useState("");
  const [customNotificationMessage, setCustomNotificationMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bankAccount, setBankAccount] = useState<BankAccountData>({
    bank_name: "",
    account_number: "",
    account_holder_name: "",
    id_number: "",
    phone: "",
    address: "",
    country: "",
    is_verified: false,
  });
  const [hasExistingAccount, setHasExistingAccount] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if admin has enabled activation block
        const { data: profile } = await supabase
          .from("profiles")
          .select("show_activation_modal, show_fatca, show_custom_notification, custom_notification_title, custom_notification_message, country")
          .eq("user_id", user.id)
          .single();

        if (profile?.show_activation_modal === true) {
          setActiveBlock('activation');
        } else if (profile?.show_fatca === true) {
          setActiveBlock('fatca');
        } else if (profile?.show_custom_notification === true) {
          setActiveBlock('custom');
          setCustomNotificationTitle(profile.custom_notification_title || "");
          setCustomNotificationMessage(profile.custom_notification_message || "");
        } else {
          setActiveBlock('none');
        }

        // Fetch existing bank account
        const { data: existingAccount } = await supabase
          .from("affiliated_bank_accounts")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (existingAccount) {
          setBankAccount({
            id: existingAccount.id,
            bank_name: existingAccount.bank_name,
            account_number: existingAccount.account_number,
            account_holder_name: existingAccount.account_holder_name,
            id_number: existingAccount.id_number,
            phone: existingAccount.phone,
            address: existingAccount.address,
            country: existingAccount.country || profile?.country || "",
            is_verified: existingAccount.is_verified,
          });
          setHasExistingAccount(true);
        } else if (profile?.country) {
          setBankAccount(prev => ({ ...prev, country: profile.country }));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (field: keyof BankAccountData, value: string) => {
    setBankAccount(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!bankAccount.bank_name.trim()) {
      toast.error("El nombre del banco es requerido");
      return;
    }
    if (!bankAccount.account_number.trim()) {
      toast.error("El número de cuenta es requerido");
      return;
    }
    if (!bankAccount.account_holder_name.trim()) {
      toast.error("El nombre del titular es requerido");
      return;
    }
    if (!bankAccount.id_number.trim()) {
      toast.error("El número de identificación es requerido");
      return;
    }
    if (!bankAccount.phone.trim()) {
      toast.error("El número de teléfono es requerido");
      return;
    }
    if (!bankAccount.address.trim()) {
      toast.error("La dirección es requerida");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const accountData = {
        user_id: user.id,
        bank_name: bankAccount.bank_name.trim(),
        account_number: bankAccount.account_number.trim(),
        account_holder_name: bankAccount.account_holder_name.trim(),
        id_number: bankAccount.id_number.trim(),
        phone: bankAccount.phone.trim(),
        address: bankAccount.address.trim(),
        country: bankAccount.country.trim() || null,
      };

      if (hasExistingAccount && bankAccount.id) {
        // Update existing
        const { error } = await supabase
          .from("affiliated_bank_accounts")
          .update(accountData)
          .eq("id", bankAccount.id);

        if (error) throw error;
        toast.success("Cuenta bancaria actualizada correctamente");
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("affiliated_bank_accounts")
          .insert(accountData)
          .select()
          .single();

        if (error) throw error;
        setBankAccount(prev => ({ ...prev, id: data.id }));
        setHasExistingAccount(true);
        toast.success("Cuenta bancaria registrada correctamente");
      }
    } catch (error: any) {
      console.error("Error saving bank account:", error);
      toast.error(error.message || "Error al guardar la cuenta bancaria");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (activeBlock === 'activation') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Cuenta Bancaria Afiliada
          </h1>
          <p className="text-muted-foreground">Afilia tu cuenta bancaria para recibir transferencias</p>
        </div>

        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            Para afiliar una cuenta bancaria, primero debes activar tu cuenta. 
            Dirígete a la sección "Vista General" y completa el proceso de activación.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (activeBlock === 'fatca') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Cuenta Bancaria Afiliada
          </h1>
          <p className="text-muted-foreground">Afilia tu cuenta bancaria para recibir transferencias</p>
        </div>

        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            Para gestionar tu cuenta bancaria, primero debes completar el cumplimiento FATCA.
            Dirígete a la sección "Retirar" para más información.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (activeBlock === 'custom') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Cuenta Bancaria Afiliada
          </h1>
          <p className="text-muted-foreground">Afilia tu cuenta bancaria para recibir transferencias</p>
        </div>

        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            <strong>{customNotificationTitle || "Aviso"}</strong>: {customNotificationMessage || "Tienes un aviso pendiente que impide gestionar tu cuenta bancaria."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          Cuenta Bancaria Afiliada
        </h1>
        <p className="text-muted-foreground">Afilia tu cuenta bancaria para recibir transferencias</p>
      </div>

      {bankAccount.is_verified ? (
        <Alert className="border-emerald-500/50 bg-emerald-500/10">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <AlertDescription className="text-emerald-600 dark:text-emerald-400">
            Tu cuenta bancaria ha sido verificada y está activa para recibir transferencias.
          </AlertDescription>
        </Alert>
      ) : hasExistingAccount && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            <strong>Inscripción Pendiente:</strong> Tu cuenta bancaria está siendo revisada por nuestro equipo. Te notificaremos cuando sea aprobada.
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Datos de la Cuenta Bancaria
          </CardTitle>
          <CardDescription>
            Ingresa los datos de tu cuenta bancaria en tu país para recibir transferencias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bank_name" className="text-foreground">
                Nombre del Banco *
              </Label>
              <Input
                id="bank_name"
                placeholder="Ej: Banco Nacional"
                value={bankAccount.bank_name}
                onChange={(e) => handleInputChange("bank_name", e.target.value)}
                className="bg-background border-border text-foreground"
                disabled={bankAccount.is_verified}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number" className="text-foreground">
                Número de Cuenta *
              </Label>
              <Input
                id="account_number"
                placeholder="Ej: 1234567890"
                value={bankAccount.account_number}
                onChange={(e) => handleInputChange("account_number", e.target.value)}
                className="bg-background border-border text-foreground font-mono"
                disabled={bankAccount.is_verified}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_holder_name" className="text-foreground">
                Nombre del Titular de la Cuenta *
              </Label>
              <Input
                id="account_holder_name"
                placeholder="Nombre completo del titular"
                value={bankAccount.account_holder_name}
                onChange={(e) => handleInputChange("account_holder_name", e.target.value)}
                className="bg-background border-border text-foreground"
                disabled={bankAccount.is_verified}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_number" className="text-foreground">
                Número de Identificación *
              </Label>
              <Input
                id="id_number"
                placeholder="DNI, Cédula, Pasaporte, etc."
                value={bankAccount.id_number}
                onChange={(e) => handleInputChange("id_number", e.target.value)}
                className="bg-background border-border text-foreground"
                disabled={bankAccount.is_verified}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">
                Número de Teléfono *
              </Label>
              <Input
                id="phone"
                placeholder="+1 234 567 8900"
                value={bankAccount.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="bg-background border-border text-foreground"
                disabled={bankAccount.is_verified}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-foreground">
                País
              </Label>
              <Input
                id="country"
                placeholder="Tu país"
                value={bankAccount.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                className="bg-background border-border text-foreground"
                disabled={bankAccount.is_verified}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-foreground">
              Dirección Afiliada al Banco *
            </Label>
            <Input
              id="address"
              placeholder="Dirección completa registrada en el banco"
              value={bankAccount.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="bg-background border-border text-foreground"
              disabled={bankAccount.is_verified}
            />
          </div>

          {!bankAccount.is_verified && (
            <div className="pt-4">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full md:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {hasExistingAccount ? "Actualizar Cuenta" : "Registrar Cuenta"}
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mt-4">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Importante:</strong> Asegúrate de que los datos coincidan exactamente con los registrados 
              en tu banco para evitar problemas con las transferencias.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserBankAccountPage;
