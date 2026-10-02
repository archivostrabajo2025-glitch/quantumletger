import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SESSION_TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const SESSION_KEY = "qlb_session_start";

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    await supabase.auth.signOut();
    toast({
      title: "Sesión expirada",
      description: "Tu sesión ha expirado después de 3 horas. Por favor, inicia sesión de nuevo.",
      variant: "destructive",
    });
    navigate("/auth");
  }, [navigate, toast]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        localStorage.removeItem(SESSION_KEY);
        return;
      }

      const sessionStart = localStorage.getItem(SESSION_KEY);
      const now = Date.now();

      if (!sessionStart) {
        // Set session start time if not exists
        localStorage.setItem(SESSION_KEY, now.toString());
        return;
      }

      const elapsed = now - parseInt(sessionStart, 10);
      
      if (elapsed >= SESSION_TIMEOUT_MS) {
        // Session expired
        handleLogout();
      } else {
        // Set timeout for remaining time
        const remaining = SESSION_TIMEOUT_MS - elapsed;
        const timeoutId = setTimeout(() => {
          handleLogout();
        }, remaining);

        return () => clearTimeout(timeoutId);
      }
    };

    checkSession();

    // Check every minute
    const intervalId = setInterval(checkSession, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [handleLogout]);

  // Reset session timer on login
  const resetSessionTimer = useCallback(() => {
    localStorage.setItem(SESSION_KEY, Date.now().toString());
  }, []);

  return { resetSessionTimer };
};
