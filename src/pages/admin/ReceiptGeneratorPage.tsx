import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const ReceiptGeneratorPage = () => {
  const [formData, setFormData] = useState({
    senderName: "",
    senderAccount: "",
    senderBank: "",
    recipientName: "",
    recipientAccount: "",
    recipientBank: "",
    amount: "",
    currency: "USD",
    concept: "",
    reference: "",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
  });

  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateReference = () => {
    const ref = `QLB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    handleInputChange("reference", ref);
  };

  const handlePrint = () => {
    if (!formData.senderName || !formData.recipientName || !formData.amount) {
      toast.error("Por favor complete los campos obligatorios");
      return;
    }
    setShowPreview(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-text">Generador de Comprobantes</h1>
          <p className="text-admin-muted">Crea comprobantes de transferencia personalizados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <Card className="bg-admin-card border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-text flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Datos del Comprobante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Datos del Remitente */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-admin-accent">Datos del Remitente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-admin-text">Nombre Completo *</Label>
                  <Input
                    value={formData.senderName}
                    onChange={(e) => handleInputChange("senderName", e.target.value)}
                    placeholder="Juan Pérez"
                    className="bg-admin-hover border-admin-border text-admin-text"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-admin-text">Número de Cuenta</Label>
                  <Input
                    value={formData.senderAccount}
                    onChange={(e) => handleInputChange("senderAccount", e.target.value)}
                    placeholder="****1234"
                    className="bg-admin-hover border-admin-border text-admin-text"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-admin-text">Banco</Label>
                  <Input
                    value={formData.senderBank}
                    onChange={(e) => handleInputChange("senderBank", e.target.value)}
                    placeholder="Quantum Ledger Business"
                    className="bg-admin-hover border-admin-border text-admin-text"
                  />
                </div>
              </div>
            </div>

            {/* Datos del Beneficiario */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-admin-accent">Datos del Beneficiario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-admin-text">Nombre Completo *</Label>
                  <Input
                    value={formData.recipientName}
                    onChange={(e) => handleInputChange("recipientName", e.target.value)}
                    placeholder="María García"
                    className="bg-admin-hover border-admin-border text-admin-text"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-admin-text">Número de Cuenta</Label>
                  <Input
                    value={formData.recipientAccount}
                    onChange={(e) => handleInputChange("recipientAccount", e.target.value)}
                    placeholder="****5678"
                    className="bg-admin-hover border-admin-border text-admin-text"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-admin-text">Banco</Label>
                  <Input
                    value={formData.recipientBank}
                    onChange={(e) => handleInputChange("recipientBank", e.target.value)}
                    placeholder="Banco Nacional"
                    className="bg-admin-hover border-admin-border text-admin-text"
                  />
                </div>
              </div>
            </div>

            {/* Datos de la Transferencia */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-admin-accent">Datos de la Transferencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-admin-text">Monto *</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    placeholder="1000.00"
                    className="bg-admin-hover border-admin-border text-admin-text"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-admin-text">Moneda</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                    <SelectTrigger className="bg-admin-hover border-admin-border text-admin-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - Dólar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                      <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-admin-text">Fecha</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="bg-admin-hover border-admin-border text-admin-text"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-admin-text">Hora</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    className="bg-admin-hover border-admin-border text-admin-text"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-admin-text">Referencia</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.reference}
                      onChange={(e) => handleInputChange("reference", e.target.value)}
                      placeholder="QLB-ABC123"
                      className="bg-admin-hover border-admin-border text-admin-text flex-1"
                    />
                    <Button onClick={generateReference} variant="outline" className="border-admin-border">
                      Generar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-admin-text">Concepto</Label>
                  <Textarea
                    value={formData.concept}
                    onChange={(e) => handleInputChange("concept", e.target.value)}
                    placeholder="Pago de servicios..."
                    className="bg-admin-hover border-admin-border text-admin-text"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setShowPreview(true)} variant="outline" className="flex-1 border-admin-border">
                <Eye className="w-4 h-4 mr-2" />
                Vista Previa
              </Button>
              <Button onClick={handlePrint} className="flex-1 bg-admin-accent hover:bg-admin-accent/90">
                <Download className="w-4 h-4 mr-2" />
                Imprimir / Descargar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vista Previa */}
        <Card className="bg-admin-card border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-text flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Vista Previa del Comprobante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              id="receipt-preview"
              className="bg-white text-black p-6 rounded-lg border shadow-lg print:shadow-none print:border-0"
              style={{ minHeight: "500px" }}
            >
              {/* Header del comprobante */}
              <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
                <img src={logo} alt="Quantum Ledger Business" className="h-16" />
                <div className="text-right">
                  <h2 className="text-xl font-bold text-gray-800">COMPROBANTE DE TRANSFERENCIA</h2>
                  <p className="text-sm text-gray-600">Ref: {formData.reference || "---"}</p>
                </div>
              </div>

              {/* Fecha y hora */}
              <div className="flex justify-between mb-6 text-sm">
                <p><strong>Fecha:</strong> {formData.date}</p>
                <p><strong>Hora:</strong> {formData.time}</p>
              </div>

              {/* Monto */}
              <div className="bg-gray-100 p-4 rounded-lg mb-6 text-center">
                <p className="text-sm text-gray-600 mb-1">Monto Transferido</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(formData.amount, formData.currency)}
                </p>
              </div>

              {/* Datos del remitente */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Ordenante</h3>
                <div className="bg-gray-50 p-3 rounded border">
                  <p className="font-semibold">{formData.senderName || "---"}</p>
                  <p className="text-sm text-gray-600">Cuenta: {formData.senderAccount || "---"}</p>
                  <p className="text-sm text-gray-600">Banco: {formData.senderBank || "---"}</p>
                </div>
              </div>

              {/* Datos del beneficiario */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Beneficiario</h3>
                <div className="bg-gray-50 p-3 rounded border">
                  <p className="font-semibold">{formData.recipientName || "---"}</p>
                  <p className="text-sm text-gray-600">Cuenta: {formData.recipientAccount || "---"}</p>
                  <p className="text-sm text-gray-600">Banco: {formData.recipientBank || "---"}</p>
                </div>
              </div>

              {/* Concepto */}
              {formData.concept && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Concepto</h3>
                  <p className="bg-gray-50 p-3 rounded border text-sm">{formData.concept}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t-2 border-gray-800 pt-4 mt-6">
                <div className="flex justify-between text-xs text-gray-500">
                  <p>Quantum Ledger Business</p>
                  <p>Transferencia Electrónica</p>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Este comprobante es un documento válido de la transacción realizada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-preview, #receipt-preview * {
            visibility: visible;
          }
          #receipt-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptGeneratorPage;
