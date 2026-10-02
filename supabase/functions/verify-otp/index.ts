import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyOtpRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email: rawEmail, code }: VerifyOtpRequest = await req.json();

    if (!rawEmail || !code) {
      throw new Error("Email and code are required");
    }

    // Normalize email to lowercase to prevent case sensitivity issues
    const email = rawEmail.toLowerCase().trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the OTP code
    const { data: otpData, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("type", "signup")
      .eq("used", false)
      .single();

    if (otpError || !otpData) {
      console.error("OTP not found or already used:", otpError);
      return new Response(
        JSON.stringify({ success: false, error: "Código inválido o ya usado" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if expired
    const expiresAt = new Date(otpData.expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "El código ha expirado" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark OTP as used
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpData.id);

    // Find the user by email and confirm them
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      throw new Error("Failed to verify user");
    }

    const user = userData.users.find((u) => u.email === email);

    // Pre-signup verification: if the account doesn't exist yet, the valid OTP
    // already proves email ownership, so we succeed without confirming a user.
    if (!user) {
      console.log("OTP verified for email without account (pre-signup):", email);
      return new Response(
        JSON.stringify({ success: true, message: "Email verified successfully" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update user to confirm email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error("Error confirming user:", updateError);
      throw new Error("Failed to confirm user");
    }

    console.log("User verified successfully:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Email verified successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
