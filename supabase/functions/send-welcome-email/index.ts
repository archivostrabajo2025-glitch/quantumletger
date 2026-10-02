import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName }: WelcomeEmailRequest = await req.json();

    if (!email || !fullName) {
      throw new Error("Missing required fields: email, fullName");
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFrom = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFrom) {
      throw new Error("SMTP configuration missing");
    }

    console.log(`Sending welcome email to: ${email}`);

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    const html = `
<!DOCTYPE html>
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
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;">Quantum Ledger Business Bank</h1>
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
</html>
    `;

    await client.send({
      from: smtpFrom,
      to: email,
      subject: "Bienvenido a Quantum Ledger Business Bank",
      content: "Tu cuenta ha sido creada exitosamente.",
      html: html,
    });

    await client.close();

    console.log("Welcome email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
