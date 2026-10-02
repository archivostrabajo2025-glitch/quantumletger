import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownLeft, Copy, QrCode, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";

const cryptoOptions = [
  { symbol: "USD", name: "Dólar (Transferencia Bancaria)", color: "#22C55E", isFiat: true },
  { symbol: "BTC", name: "Bitcoin", color: "#F7931A", isFiat: false },
  { symbol: "ETH", name: "Ethereum", color: "#627EEA", isFiat: false },
  { symbol: "USDT", name: "Tether", color: "#26A17B", isFiat: false },
  { symbol: "BNB", name: "Binance Coin", color: "#F3BA2F", isFiat: false },
  { symbol: "LTC", name: "Litecoin", color: "#345D9D", isFiat: false },
];

// Generate a deterministic address based on user ID and crypto symbol
const generateAddress = (userId: string, symbol: string): string => {
  const hash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  const baseHash = hash(userId + symbol);
  
  switch (symbol) {
    case "BTC":
      return `bc1q${baseHash.padEnd(38, 'a').slice(0, 38)}`;
    case "ETH":
    case "USDT":
      return `0x${baseHash.padEnd(40, '0').slice(0, 40)}`;
    case "BNB":
      return `bnb1${baseHash.padEnd(38, 'g').slice(0, 38)}`;
    case "LTC":
      return `ltc1q${baseHash.padEnd(38, 'k').slice(0, 38)}`;
    default:
      return `0x${baseHash.padEnd(40, '0').slice(0, 40)}`;
  }
};

// Generate bank account numbers based on user ID
const generateBankNumbers = (userId: string) => {
  const hash = (str: string, seed: number) => {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const accountNumber = (hash(userId, 12345) % 90000000 + 10000000).toString();
  const routingNumber = (hash(userId, 67890) % 900000000 + 100000000).toString();

  return { accountNumber, routingNumber };
};

const UserDepositPage = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  const selectedOption = cryptoOptions.find(c => c.symbol === selectedCrypto);
  const generatedAddress = userId && selectedOption && !selectedOption.isFiat 
    ? generateAddress(userId, selectedOption.symbol) 
    : "";
  const bankNumbers = userId ? generateBankNumbers(userId) : { accountNumber: "", routingNumber: "" };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ArrowDownLeft className="w-6 h-6 text-green-500" />
          Depositar
        </h1>
        <p className="text-muted-foreground">Deposita fondos en tu cuenta</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Seleccionar Método</CardTitle>
            <CardDescription>Elige cómo deseas depositar fondos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Método de depósito</Label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecciona una moneda" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {cryptoOptions.map((crypto) => (
                    <SelectItem key={crypto.symbol} value={crypto.symbol}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: crypto.color }}
                        />
                        {crypto.name} ({crypto.symbol})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* USD Bank Transfer View */}
        {selectedOption?.isFiat && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Building2 className="w-6 h-6 text-green-500" />
                Datos Bancarios para Depósito
              </CardTitle>
              <CardDescription>
                Usa estos datos para realizar una transferencia bancaria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Número de Cuenta (8 dígitos)</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={bankNumbers.accountNumber}
                    className="bg-background border-border text-foreground font-mono text-lg tracking-widest"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(bankNumbers.accountNumber, "Número de cuenta")}
                    className="border-border"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Número de Ruta (9 dígitos)</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={bankNumbers.routingNumber}
                    className="bg-background border-border text-foreground font-mono text-lg tracking-widest"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(bankNumbers.routingNumber, "Número de ruta")}
                    className="border-border"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  <strong>Transferencia desde el mismo banco:</strong> Si realizas la transferencia desde este mismo banco, 
                  el depósito será <strong>inmediato</strong>.
                </p>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  <strong>Importante:</strong> Asegúrate de usar exactamente estos números al realizar la transferencia. 
                  Para transferencias desde otros bancos, los depósitos se reflejarán en 1-3 días hábiles.
                </p>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Mismo banco: Inmediato</p>
                <p>• Otros bancos: 1-3 días hábiles</p>
                <p>• Sin comisiones por depósito</p>
                <p>• Monto mínimo: $10 USD</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crypto Deposit View */}
        {selectedOption && !selectedOption.isFiat && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full" 
                  style={{ backgroundColor: selectedOption.color }}
                />
                Dirección de Depósito {selectedOption.symbol}
              </CardTitle>
              <CardDescription>
                Envía solo {selectedOption.name} a esta dirección
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center p-4 bg-background rounded-lg">
                {generatedAddress ? (
                  <QRCodeSVG 
                    value={generatedAddress} 
                    size={128}
                    bgColor="transparent"
                    fgColor="currentColor"
                    className="text-foreground"
                  />
                ) : (
                  <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Dirección de la billetera</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={generatedAddress}
                    className="bg-background border-border text-foreground font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(generatedAddress, "Dirección")}
                    className="border-border"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  <strong>Importante:</strong> Solo envía {selectedOption.symbol} a esta dirección. 
                  Enviar cualquier otra criptomoneda puede resultar en la pérdida permanente de fondos.
                </p>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Confirmaciones mínimas: 3</p>
                <p>• Tiempo estimado: 10-30 minutos</p>
                <p>• Sin monto mínimo de depósito</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserDepositPage;
