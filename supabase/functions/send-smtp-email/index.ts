import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json();

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, html");
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT") || "465";
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFrom = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFrom) {
      throw new Error("SMTP configuration missing");
    }

    console.log(`Connecting to SMTP server: ${smtpHost}:${smtpPort}`);

    // Build raw MIME email
    const boundary = "----=_Part_" + crypto.randomUUID().replace(/-/g, "");
    const rawEmail = [
      `From: ${smtpFrom}`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: quoted-printable`,
      ``,
      text || "Este correo requiere un cliente que soporte HTML.",
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(html))),
      ``,
      `--${boundary}--`,
    ].join("\r\n");

    // Connect via raw TCP/TLS to SMTP
    const port = parseInt(smtpPort);
    const conn = await Deno.connectTls({
      hostname: smtpHost,
      port: port,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    async function readResponse(): Promise<string> {
      const buf = new Uint8Array(4096);
      const n = await conn.read(buf);
      if (n === null) throw new Error("Connection closed");
      return decoder.decode(buf.subarray(0, n));
    }

    async function sendCommand(cmd: string): Promise<string> {
      await conn.write(encoder.encode(cmd + "\r\n"));
      const resp = await readResponse();
      console.log(`SMTP: ${cmd.startsWith("AUTH") || cmd.startsWith("PASS") ? "***" : cmd} -> ${resp.trim().substring(0, 80)}`);
      return resp;
    }

    // SMTP handshake
    const greeting = await readResponse();
    console.log("SMTP greeting:", greeting.trim().substring(0, 80));

    await sendCommand(`EHLO localhost`);
    
    // AUTH LOGIN
    await sendCommand(`AUTH LOGIN`);
    await sendCommand(btoa(smtpUser));
    const authResp = await sendCommand(btoa(smtpPassword));
    
    if (!authResp.startsWith("235")) {
      throw new Error("SMTP authentication failed: " + authResp);
    }

    await sendCommand(`MAIL FROM:<${smtpFrom}>`);
    await sendCommand(`RCPT TO:<${to}>`);
    await sendCommand(`DATA`);
    
    // Send email data
    await conn.write(encoder.encode(rawEmail + "\r\n.\r\n"));
    const dataResp = await readResponse();
    console.log("DATA response:", dataResp.trim().substring(0, 80));

    await sendCommand(`QUIT`);
    conn.close();

    console.log("Email sent successfully to:", to);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
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
