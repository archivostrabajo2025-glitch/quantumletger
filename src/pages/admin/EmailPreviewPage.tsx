import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EmailPreviewPage = () => {
  const [activeTab, setActiveTab] = useState("welcome");

  const getTransactionEmailHtml = (type: 'deposit' | 'withdrawal') => {
    const isDeposit = type === 'deposit';
    const typeLabel = isDeposit ? 'Depósito' : 'Retiro';
    const headerColor = isDeposit ? '#10B981' : '#F59E0B';
    const amount = 1500;
    const crypto = 'USDT';
    const usdValue = 1500;
    const fullName = 'Juan Pérez';
    const transactionHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const description = 'Transacción de ejemplo';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background-color:${headerColor};padding:40px 32px;text-align:center;">
              <p style="margin:0 0 10px;color:#ffffff;font-size:18px;font-weight:bold;">Quantum Ledger Business Bank</p>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;">
                ${typeLabel} ${isDeposit ? 'Recibido' : 'Procesado'}
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding:40px 32px;">
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:12px;margin-bottom:32px;">
                <tr>
                  <td style="padding:32px;text-align:center;">
                    <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Monto</p>
                    <p style="margin:0;color:${headerColor};font-size:42px;font-weight:bold;">
                      ${isDeposit ? '+' : '-'}${amount}
                    </p>
                    <p style="margin:8px 0 0;color:#374151;font-size:18px;font-weight:600;">${crypto}</p>
                    <p style="margin:12px 0 0;color:#6b7280;font-size:14px;">Equivalente: $${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin:0 0 24px;color:#1f2937;font-size:16px;line-height:1.6;">
                Hola <strong>${fullName}</strong>,
              </p>
              
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                ${isDeposit 
                  ? 'Hemos registrado exitosamente un depósito en tu cuenta. Los fondos ya están disponibles para usar.'
                  : 'Tu solicitud de retiro ha sido procesada exitosamente.'}
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;background-color:#f9fafb;border-bottom:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#6b7280;font-size:14px;">Tipo</td>
                        <td align="right" style="color:#111827;font-size:14px;font-weight:600;">${typeLabel}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;background-color:#ffffff;border-bottom:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#6b7280;font-size:14px;">Criptomoneda</td>
                        <td align="right" style="color:#111827;font-size:14px;font-weight:600;">${crypto}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;background-color:#f9fafb;border-bottom:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#6b7280;font-size:14px;">Cantidad</td>
                        <td align="right" style="color:#111827;font-size:14px;font-weight:600;">${amount} ${crypto}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;background-color:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#6b7280;font-size:14px;">Estado</td>
                        <td align="right">
                          <span style="display:inline-block;background-color:#DEF7EC;color:#03543F;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">Completado</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Hash de Transacción</p>
                    <p style="margin:0;color:#4b5563;font-size:12px;font-family:monospace;word-break:break-all;line-height:1.5;">${transactionHash}</p>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f9ff;border-left:4px solid #0284c7;border-radius:4px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;color:#0369a1;font-size:12px;font-weight:bold;text-transform:uppercase;">Descripción</p>
                    <p style="margin:0;color:#0c4a6e;font-size:14px;line-height:1.5;">${description}</p>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fefce8;border-radius:8px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#854d0e;font-size:13px;line-height:1.5;">
                      Si no reconoces esta transacción, contacta a soporte inmediatamente.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <tr>
            <td style="background-color:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Quantum Ledger Business Bank</p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">Este es un mensaje automatico, por favor no responda.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const getVerificationEmailHtml = (status: 'approved' | 'rejected') => {
    const isApproved = status === 'approved';
    const fullName = 'Juan Pérez';
    const notes = 'El documento proporcionado está borroso y no se puede leer correctamente.';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background-color:${isApproved ? '#10B981' : '#EF4444'};padding:40px 32px;text-align:center;">
              <p style="margin:0 0 10px;color:#ffffff;font-size:18px;font-weight:bold;">Quantum Ledger Business Bank</p>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;">
                ${isApproved ? 'Cuenta Verificada' : 'Verificación Rechazada'}
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding:40px 32px;">
              <p style="margin:0 0 24px;color:#1f2937;font-size:16px;line-height:1.6;">
                Hola <strong>${fullName}</strong>,
              </p>
              
              ${isApproved ? `
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                Tu cuenta ha sido verificada exitosamente. Ahora tienes acceso completo a todas las funcionalidades de Quantum Ledger Business Bank.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;color:#166534;font-size:14px;font-weight:bold;">Beneficios desbloqueados:</p>
                    <p style="margin:0 0 8px;color:#166534;font-size:14px;">• Depósitos y retiros ilimitados</p>
                    <p style="margin:0 0 8px;color:#166534;font-size:14px;">• Pagos internacionales</p>
                    <p style="margin:0;color:#166534;font-size:14px;">• Acceso a funciones premium</p>
                  </td>
                </tr>
              </table>
              ` : `
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                Lamentamos informarte que tu solicitud de verificación no fue aprobada.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border-left:4px solid #EF4444;border-radius:4px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;color:#991b1b;font-size:12px;font-weight:bold;text-transform:uppercase;">Motivo</p>
                    <p style="margin:0;color:#991b1b;font-size:14px;line-height:1.5;">${notes}</p>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:bold;">Para volver a intentar:</p>
                    <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">• Sube documentos claros y legibles</p>
                    <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">• La foto debe coincidir con el documento</p>
                    <p style="margin:0;color:#6b7280;font-size:14px;">• El documento no debe estar vencido</p>
                  </td>
                </tr>
              </table>
              `}
            </td>
          </tr>
          
          <tr>
            <td style="background-color:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Quantum Ledger Business Bank</p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">Este es un mensaje automatico, por favor no responda.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const getWelcomeEmailHtml = () => {
    const fullName = 'Juan Pérez';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background-color:#ffffff;border-radius:8px;">
          
          <tr>
            <td style="background-color:#1a1a2e;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:bold;">Quantum Ledger Business Bank</h1>
              <p style="color:#cccccc;margin:10px 0 0;font-size:14px;">Bienvenido</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding:30px 20px;">
              <p style="color:#333333;font-size:16px;margin:0 0 20px 0;">
                Hola <strong>${fullName}</strong>,
              </p>
              
              <p style="color:#333333;font-size:16px;margin:0 0 20px 0;">
                Tu cuenta ha sido creada exitosamente. Estamos emocionados de tenerte con nosotros.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f9ff;border-radius:8px;margin:20px 0;">
                <tr>
                  <td style="padding:20px;">
                    <p style="color:#0369a1;font-size:14px;margin:0 0 10px 0;font-weight:bold;">
                      Proximos pasos:
                    </p>
                    <p style="color:#333333;font-size:14px;margin:0 0 8px 0;">
                      1. Completa la verificacion de tu identidad
                    </p>
                    <p style="color:#333333;font-size:14px;margin:0 0 8px 0;">
                      2. Activa tu cuenta con un deposito inicial
                    </p>
                    <p style="color:#333333;font-size:14px;margin:0;">
                      3. Comienza a operar con criptomonedas
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color:#666666;font-size:14px;margin:20px 0 0 0;">
                Si tienes alguna pregunta, no dudes en contactarnos.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color:#f9f9f9;padding:20px;text-align:center;border-radius:0 0 8px 8px;border-top:1px solid #eeeeee;">
              <p style="color:#999999;font-size:12px;margin:0;">
                Quantum Ledger Business Bank - Tu plataforma de confianza
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const emailTemplates = {
    welcome: getWelcomeEmailHtml(),
    deposit: getTransactionEmailHtml('deposit'),
    withdrawal: getTransactionEmailHtml('withdrawal'),
    verified: getVerificationEmailHtml('approved'),
    rejected: getVerificationEmailHtml('rejected'),
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-6">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-2xl font-bold text-foreground mb-6">Vista Previa de Emails</h1>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="welcome">Bienvenida</TabsTrigger>
                  <TabsTrigger value="deposit">Depósito</TabsTrigger>
                  <TabsTrigger value="withdrawal">Retiro</TabsTrigger>
                  <TabsTrigger value="verified">Verificación Aprobada</TabsTrigger>
                  <TabsTrigger value="rejected">Verificación Rechazada</TabsTrigger>
                </TabsList>

                {Object.entries(emailTemplates).map(([key, html]) => (
                  <TabsContent key={key} value={key}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {key === 'welcome' && 'Email de Bienvenida'}
                          {key === 'deposit' && 'Email de Depósito'}
                          {key === 'withdrawal' && 'Email de Retiro'}
                          {key === 'verified' && 'Email de Verificación Aprobada'}
                          {key === 'rejected' && 'Email de Verificación Rechazada'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                          <iframe
                            srcDoc={html}
                            className="w-full h-[700px] bg-white"
                            title={`Email preview - ${key}`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EmailPreviewPage;
