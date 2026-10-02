import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RegisterTrustedDeviceRequest {
  email: string;
  deviceToken: string;
  deviceName?: string;
}

function generateDeviceToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email: rawEmail, deviceToken, deviceName }: RegisterTrustedDeviceRequest = await req.json();

    if (!rawEmail) {
      throw new Error("Email is required");
    }

    const email = rawEmail.toLowerCase().trim();
    const token = deviceToken || generateDeviceToken();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find((u) => u.email === email);
    
    if (!user) {
      throw new Error("User not found");
    }

    // Delete any existing token for this user/device combination
    await supabase
      .from("trusted_devices")
      .delete()
      .eq("user_id", user.id)
      .eq("device_token", token);

    // Calculate expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Get device info from user agent
    const userAgent = req.headers.get("user-agent") || "Unknown Device";
    const finalDeviceName = deviceName || userAgent.substring(0, 100);

    // Insert new trusted device
    const { error: insertError } = await supabase
      .from("trusted_devices")
      .insert({
        user_id: user.id,
        device_token: token,
        device_name: finalDeviceName,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting trusted device:", insertError);
      throw new Error("Failed to register trusted device");
    }

    console.log("Trusted device registered for user:", email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deviceToken: token,
        expiresAt: expiresAt.toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error registering trusted device:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
