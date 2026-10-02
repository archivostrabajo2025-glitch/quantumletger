import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Attachment {
  filename: string;
  content: string; // base64 encoded
  type: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachment?: Attachment;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text, attachment }: EmailRequest = await req.json();

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, html");
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFrom = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFrom) {
      throw new Error("SMTP configuration missing");
    }

    console.log(`Connecting to SMTP server: ${smtpHost}:${smtpPort}`);
    console.log(`Sending email to: ${to}`);
    console.log(`Has attachment: ${!!attachment}`);

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

    console.log("SMTP connected, preparing email...");

    // Build email options
    const emailOptions: any = {
      from: smtpFrom,
      to: to,
      subject: subject,
      content: "auto",
      html: html,
    };

    // Add attachment if provided
    if (attachment) {
      console.log(`Attaching file: ${attachment.filename}`);
      
      // Decode base64 to Uint8Array
      const binaryContent = Uint8Array.from(atob(attachment.content), c => c.charCodeAt(0));
      
      emailOptions.attachments = [
        {
          filename: attachment.filename,
          content: binaryContent,
          contentType: attachment.type,
          encoding: "binary",
        },
      ];
    }

    await client.send(emailOptions);
    await client.close();

    console.log("Email with attachment sent successfully to:", to);

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
