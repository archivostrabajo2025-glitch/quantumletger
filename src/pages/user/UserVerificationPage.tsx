import { useState, useEffect } from "react";
import { Shield, Upload, Camera, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UserVerificationPage = () => {
  const [verificationStatus, setVerificationStatus] = useState<string>("pending");
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [existingIdUrl, setExistingIdUrl] = useState<string | null>(null);
  const [existingSelfieUrl, setExistingSelfieUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState<string | null>(null);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_status, id_document_url, selfie_url, verification_notes")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setVerificationStatus(profile.verification_status || "pending");
      setExistingIdUrl(profile.id_document_url);
      setExistingSelfieUrl(profile.selfie_url);
      setVerificationNotes(profile.verification_notes);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("El archivo es muy grande. Máximo 10MB.");
        return;
      }
      setIdDocument(file);
      if (file.type.startsWith('image/')) {
        setIdPreview(URL.createObjectURL(file));
      } else {
        setIdPreview(null);
      }
    }
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("El archivo es muy grande. Máximo 10MB.");
        return;
      }
      setSelfie(file);
      if (file.type.startsWith('image/')) {
        setSelfiePreview(URL.createObjectURL(file));
      } else {
        setSelfiePreview(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!idDocument || !selfie) {
      toast.error("Por favor sube ambos documentos");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Upload ID document
      const idExt = idDocument.name.split('.').pop();
      const idPath = `${user.id}/id-document-${Date.now()}.${idExt}`;
      const { error: idError } = await supabase.storage
        .from("identity-documents")
        .upload(idPath, idDocument);

      if (idError) throw idError;

      // Upload selfie
      const selfieExt = selfie.name.split('.').pop();
      const selfiePath = `${user.id}/selfie-${Date.now()}.${selfieExt}`;
      const { error: selfieError } = await supabase.storage
        .from("identity-documents")
        .upload(selfiePath, selfie);

      if (selfieError) throw selfieError;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          verification_status: "submitted",
          id_document_url: idPath,
          selfie_url: selfiePath,
          verification_submitted_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      toast.success("Documentos enviados. Tu verificación está en revisión.");
      setVerificationStatus("submitted");
      fetchVerificationStatus();
    } catch (error: any) {
      console.error("Error uploading documents:", error);
      toast.error(error.message || "Error al subir documentos");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verificado
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            <Clock className="w-3 h-3 mr-1" />
            En Revisión
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-border">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
    }
  };

  const canSubmit = verificationStatus === "pending" || verificationStatus === "rejected";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verificación de Cuenta</h1>
        <p className="text-muted-foreground">Verifica tu identidad para acceder a todas las funciones</p>
      </div>

      {/* Status Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Estado de Verificación</CardTitle>
                <CardDescription>Tu cuenta necesita verificación de identidad</CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          {verificationStatus === "approved" && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-500 font-medium">
                ¡Tu cuenta está verificada! Tienes acceso completo a todas las funciones.
              </p>
            </div>
          )}
          {verificationStatus === "submitted" && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-500 font-medium">
                Tus documentos están siendo revisados. Este proceso puede tomar 24-48 horas.
              </p>
            </div>
          )}
          {verificationStatus === "rejected" && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-500 font-medium mb-2">
                Tu verificación fue rechazada. Por favor, envía nuevamente tus documentos.
              </p>
              {verificationNotes && (
                <p className="text-red-400 text-sm">Motivo: {verificationNotes}</p>
              )}
            </div>
          )}
          {verificationStatus === "pending" && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-muted-foreground">
                Para verificar tu cuenta, necesitas subir una foto de tu documento de identidad y una foto de tu rostro (selfie).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Section */}
      {canSubmit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ID Document */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Documento de Identidad
              </CardTitle>
              <CardDescription>
                Sube una foto clara de tu pasaporte o identificación nacional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="block">
                <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  idPreview ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}>
                  {idPreview ? (
                    <div className="space-y-3">
                      <img src={idPreview} alt="ID Preview" className="max-h-40 mx-auto rounded-lg" />
                      <p className="text-sm text-primary">Documento seleccionado</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Haz clic o arrastra tu documento aquí
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, HEIC hasta 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handleIdChange}
                  className="hidden"
                />
              </label>
            </CardContent>
          </Card>

          {/* Selfie */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Foto de tu Rostro
              </CardTitle>
              <CardDescription>
                Sube una selfie clara donde se vea bien tu cara
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="block">
                <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  selfiePreview ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}>
                  {selfiePreview ? (
                    <div className="space-y-3">
                      <img src={selfiePreview} alt="Selfie Preview" className="max-h-40 mx-auto rounded-lg" />
                      <p className="text-sm text-primary">Selfie seleccionada</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Haz clic o arrastra tu foto aquí
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, HEIC hasta 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handleSelfieChange}
                  className="hidden"
                />
              </label>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submit Button */}
      {canSubmit && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={!idDocument || !selfie || loading}
            className="min-w-[200px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Enviando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Enviar para Verificación
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Requirements */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Requisitos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>El documento debe estar vigente y no vencido</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>La foto debe ser clara y legible, sin reflejos</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>La selfie debe mostrar tu rostro completo con buena iluminación</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>No uses fotos de fotos o capturas de pantalla</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserVerificationPage;