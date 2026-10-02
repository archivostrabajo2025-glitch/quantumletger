import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OtpRequest {
  email: string;
  fullName?: string;
  type?: "signup" | "password_reset" | "login";
}

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email: rawEmail, fullName, type = "signup" }: OtpRequest = await req.json();

    if (!rawEmail) {
      throw new Error("Email is required");
    }

    // Normalize email to lowercase to prevent case sensitivity issues
    const email = rawEmail.toLowerCase().trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For password reset, verify user exists
    if (type === "password_reset") {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const userExists = userData?.users?.some((u) => u.email === email);
      if (!userExists) {
        // Return success anyway to prevent email enumeration
        return new Response(
          JSON.stringify({ success: true, message: "If email exists, OTP was sent" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Reuse a very recent code so requests from multiple devices cannot
    // invalidate each other while the first email is still in transit.
    const { data: existingOtp } = await supabase
      .from("otp_codes")
      .select("code, expires_at")
      .eq("email", email)
      .eq("type", type)
      .eq("used", false)
      .maybeSingle();

    const existingExpiry = existingOtp?.expires_at
      ? new Date(existingOtp.expires_at).getTime()
      : 0;
    const isRecent = existingExpiry > Date.now() + 9 * 60 * 1000;
    const otpCode = isRecent && existingOtp?.code
      ? existingOtp.code
      : generateOtpCode();

    if (!isRecent) {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await supabase
        .from("otp_codes")
        .delete()
        .eq("email", email)
        .eq("type", type);

      const { error: insertError } = await supabase.from("otp_codes").insert({
        email,
        code: otpCode,
        type,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

      if (insertError) {
        console.error("Error inserting OTP:", insertError);
        throw new Error("Failed to generate OTP");
      }
    }

    console.log(`Sending OTP email to: ${email}`);

    const messageId = crypto.randomUUID();
    const templateName = `otp_${type}`;

    try {
      const result = await sendTemplateEmail("otp-code", email, {
        templateData: { otpCode, fullName, type },
        idempotencyKey: messageId,
      });

      const { error: logError } = await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: email,
        status: result.sent ? "sent" : "suppressed",
        error_message: result.sent ? null : "recipient_suppressed",
      });
      if (logError) console.error("Email log error:", logError);

      if (!result.sent) {
        console.log("Recipient suppressed, OTP email not delivered:", email);
        return new Response(
          JSON.stringify({
            success: false,
            error: "No pudimos entregar el código a este correo. Usa otra dirección o revisa si el proveedor bloqueó al remitente.",
          }),
          {
            status: 422,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      } else {
        console.log("OTP email sent successfully for:", email);
      }
    } catch (sendError: any) {
      const { error: logError } = await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: email,
        status: "failed",
        error_message: sendError?.message ?? "unknown error",
      });
      if (logError) console.error("Email log error:", logError);
      throw sendError;
    }


    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
