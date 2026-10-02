import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckTrustedDeviceRequest {
  email: string;
  deviceToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email: rawEmail, deviceToken }: CheckTrustedDeviceRequest = await req.json();

    if (!rawEmail || !deviceToken) {
      return new Response(
        JSON.stringify({ trusted: false }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const email = rawEmail.toLowerCase().trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find((u) => u.email === email);
    
    if (!user) {
      return new Response(
        JSON.stringify({ trusted: false }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if device is trusted and not expired
    const { data: trustedDevice, error } = await supabase
      .from("trusted_devices")
      .select("*")
      .eq("user_id", user.id)
      .eq("device_token", deviceToken)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !trustedDevice) {
      return new Response(
        JSON.stringify({ trusted: false }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update last_used_at
    await supabase
      .from("trusted_devices")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", trustedDevice.id);

    console.log("Trusted device found for user:", email);

    return new Response(
      JSON.stringify({ trusted: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error checking trusted device:", error);
    return new Response(
      JSON.stringify({ trusted: false }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
