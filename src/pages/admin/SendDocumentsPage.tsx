import { useState, useEffect } from "react";
import { FileUp, Send, User, Mail, FileText, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

const SendDocumentsPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email")
        .order("full_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast.error("Solo se permiten archivos PDF");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("El archivo no puede superar 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data:application/pdf;base64, prefix
        resolve(base64.split(",")[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSend = async () => {
    if (!selectedUser) {
      toast.error("Selecciona un usuario");
      return;
    }
    if (!subject.trim()) {
      toast.error("Ingresa un asunto");
      return;
    }
    if (!file) {
      toast.error("Adjunta un archivo PDF");
      return;
    }

    const user = users.find(u => u.user_id === selectedUser);
    if (!user) {
      toast.error("Usuario no encontrado");
      return;
    }

    setLoading(true);

    try {
      const fileBase64 = await convertFileToBase64(file);

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: #00d4ff; margin: 0; font-size: 24px;">Quantum Ledger</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333; margin-top: 0;">Hola ${user.full_name},</h2>
            <p style="color: #666; line-height: 1.6;">
              ${message || "Te enviamos el documento adjunto para tu revisión."}
            </p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #333;">
                <strong>📎 Documento adjunto:</strong> ${file.name}
              </p>
            </div>
            <p style="color: #666; font-size: 14px;">
              Si tienes alguna pregunta, no dudes en contactarnos.
            </p>
          </div>
          <div style="background: #1a1a2e; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="color: #888; margin: 0; font-size: 12px;">
              © 2024 Quantum Ledger. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `;

      const { data, error } = await supabase.functions.invoke("send-document-email", {
        body: {
          to: user.email,
          subject: subject,
          html: emailHtml,
          attachment: {
            filename: file.name,
            content: fileBase64,
            type: "application/pdf"
          }
        }
      });

      if (error) throw error;

      toast.success(`Documento enviado a ${user.full_name}`);
      
      // Reset form
      setSelectedUser("");
      setSubject("");
      setMessage("");
      setFile(null);
    } catch (error: any) {
      console.error("Error sending document:", error);
      toast.error("Error al enviar el documento: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedUserData = users.find(u => u.user_id === selectedUser);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enviar Documentos</h1>
        <p className="text-muted-foreground">Envía archivos PDF a los usuarios por correo electrónico</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send Form */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-accent" />
              Enviar Documento
            </CardTitle>
            <CardDescription>
              Selecciona un usuario y adjunta el PDF a enviar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="user">Usuario destinatario</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingUsers ? "Cargando usuarios..." : "Seleccionar usuario"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{user.full_name}</span>
                        <span className="text-muted-foreground text-sm">({user.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto del correo</Label>
              <Input
                id="subject"
                placeholder="Ej: Documento importante - Quantum Ledger"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje (opcional)</Label>
              <Textarea
                id="message"
                placeholder="Escribe un mensaje para el usuario..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Archivo PDF</Label>
              {!file ? (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileUp className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Haz clic para seleccionar un PDF
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Máximo 10MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <FileText className="w-8 h-8 text-accent" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={loading || !selectedUser || !subject || !file}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Documento
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-accent" />
              Vista Previa
            </CardTitle>
            <CardDescription>
              Así se verá el correo que recibirá el usuario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-border">
              {/* Email Header Preview */}
              <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-4">
                <h3 className="text-accent font-bold">Quantum Ledger</h3>
              </div>
              
              {/* Email Body Preview */}
              <div className="bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Para:</span>
                  {selectedUserData ? (
                    <Badge variant="secondary">
                      {selectedUserData.email}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">Selecciona un usuario</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Asunto:</span>
                  <span>{subject || "Sin asunto"}</span>
                </div>
                
                <hr className="border-gray-200" />
                
                <div className="space-y-2">
                  <p className="text-gray-800">
                    Hola {selectedUserData?.full_name || "[Nombre]"},
                  </p>
                  <p className="text-gray-600 text-sm">
                    {message || "Te enviamos el documento adjunto para tu revisión."}
                  </p>
                </div>
                
                {file && (
                  <div className="bg-gray-100 p-3 rounded-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                  </div>
                )}
              </div>
              
              {/* Email Footer Preview */}
              <div className="bg-[#1a1a2e] p-3 text-center">
                <p className="text-gray-400 text-xs">
                  © 2024 Quantum Ledger. Todos los derechos reservados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SendDocumentsPage;
