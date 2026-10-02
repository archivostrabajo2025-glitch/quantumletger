import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  FileText,
  User,
  Download
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VerificationRequest {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  verification_status: string;
  id_document_url: string | null;
  selfie_url: string | null;
  verification_submitted_at: string | null;
  verification_reviewed_at: string | null;
  verification_notes: string | null;
  created_at: string;
}

const VerificationManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-all-profiles');
      
      if (error) throw error;
      
      // Filter only users who have submitted verification
      const verificationRequests = (data.profiles || []).filter(
        (p: VerificationRequest) => p.verification_status === 'submitted' || 
        p.verification_status === 'approved' || 
        p.verification_status === 'rejected'
      );
      
      setRequests(verificationRequests);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes de verificación.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReview = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setReviewNotes(request.verification_notes || "");
  };

  const handleUpdateStatus = async (newStatus: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase.functions.invoke('update-user-balance', {
        body: {
          userId: selectedRequest.user_id,
          verification_status: newStatus,
          verification_notes: reviewNotes,
          verification_reviewed_at: new Date().toISOString(),
        }
      });

      if (error) throw error;

      toast({
        title: newStatus === 'approved' ? "Verificación aprobada" : "Verificación rechazada",
        description: `La verificación de ${selectedRequest.full_name} ha sido ${newStatus === 'approved' ? 'aprobada' : 'rechazada'}.`,
      });

      setSelectedRequest(null);
      setReviewNotes("");
      fetchRequests();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de verificación.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      submitted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    const labels = {
      pending: "Pendiente",
      submitted: "En Revisión",
      approved: "Aprobado",
      rejected: "Rechazado",
    };
    const icons = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      submitted: <Eye className="w-3 h-3 mr-1" />,
      approved: <CheckCircle className="w-3 h-3 mr-1" />,
      rejected: <XCircle className="w-3 h-3 mr-1" />,
    };
    return (
      <Badge variant="outline" className={`flex items-center ${styles[status as keyof typeof styles] || styles.pending}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || "Pendiente"}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSignedUrl = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('identity-documents')
      .createSignedUrl(path, 3600);
    
    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
    return data.signedUrl;
  };

  const handleViewDocument = async (url: string | null, type: 'document' | 'selfie') => {
    if (!url) {
      toast({
        title: "Sin documento",
        description: `No hay ${type === 'document' ? 'documento de identidad' : 'selfie'} disponible.`,
        variant: "destructive",
      });
      return;
    }

    const signedUrl = await getSignedUrl(url);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      toast({
        title: "Error",
        description: "No se pudo obtener el documento.",
        variant: "destructive",
      });
    }
  };

  const pendingCount = requests.filter(r => r.verification_status === 'submitted').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verificación de Identidad</h1>
          <p className="text-muted-foreground mt-1">
            Revisa y aprueba las solicitudes de verificación de usuarios
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-500 font-medium">
                ({pendingCount} pendiente{pendingCount !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" onClick={fetchRequests} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {requests.filter(r => r.verification_status === 'submitted').length}
                </p>
                <p className="text-sm text-muted-foreground">En Revisión</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {requests.filter(r => r.verification_status === 'approved').length}
                </p>
                <p className="text-sm text-muted-foreground">Aprobados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {requests.filter(r => r.verification_status === 'rejected').length}
                </p>
                <p className="text-sm text-muted-foreground">Rechazados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{requests.length}</p>
                <p className="text-sm text-muted-foreground">Total Solicitudes</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="submitted">En Revisión</SelectItem>
                <SelectItem value="approved">Aprobados</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Sin solicitudes</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {searchTerm || statusFilter !== "all" 
                  ? "No se encontraron solicitudes con ese criterio de búsqueda." 
                  : "No hay solicitudes de verificación pendientes."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estado</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Documentos</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fecha Envío</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fecha Revisión</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <span className="text-accent font-semibold text-sm">
                              {request.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{request.full_name}</p>
                            <p className="text-sm text-muted-foreground">{request.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(request.verification_status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleViewDocument(request.id_document_url, 'document')}
                            disabled={!request.id_document_url}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            ID
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleViewDocument(request.selfie_url, 'selfie')}
                            disabled={!request.selfie_url}
                          >
                            <User className="w-3 h-3 mr-1" />
                            Selfie
                          </Button>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {formatDate(request.verification_submitted_at)}
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {formatDate(request.verification_reviewed_at)}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReview(request)}
                          className="text-accent border-accent/20 hover:bg-accent/10"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Revisar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar Verificación</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent font-semibold">
                    {selectedRequest.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedRequest.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.email}</p>
                </div>
                <div className="ml-auto">
                  {getStatusBadge(selectedRequest.verification_status)}
                </div>
              </div>

              {/* Documents */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Documento de Identidad</Label>
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => handleViewDocument(selectedRequest.id_document_url, 'document')}
                    disabled={!selectedRequest.id_document_url}
                  >
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedRequest.id_document_url ? "Ver Documento" : "No disponible"}
                    </span>
                  </Button>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Selfie</Label>
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => handleViewDocument(selectedRequest.selfie_url, 'selfie')}
                    disabled={!selectedRequest.selfie_url}
                  >
                    <User className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedRequest.selfie_url ? "Ver Selfie" : "No disponible"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Fecha de envío:</span>
                  <p className="font-medium text-foreground">
                    {formatDate(selectedRequest.verification_submitted_at)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Última revisión:</span>
                  <p className="font-medium text-foreground">
                    {formatDate(selectedRequest.verification_reviewed_at)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notas de Revisión</Label>
                <Textarea
                  id="notes"
                  placeholder="Agregar notas sobre la revisión..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            {selectedRequest?.verification_status === 'submitted' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Rechazar
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Aprobar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationManagement;
