-- Fix function search path
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now() OR used = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;