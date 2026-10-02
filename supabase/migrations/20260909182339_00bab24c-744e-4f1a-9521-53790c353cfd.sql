CREATE TABLE public.transfer_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_account_id uuid REFERENCES public.affiliated_bank_accounts(id) ON DELETE SET NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.transfer_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.transfer_requests TO authenticated;
GRANT ALL ON public.transfer_requests TO service_role;

ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own transfer requests"
ON public.transfer_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transfer requests"
ON public.transfer_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transfer requests"
ON public.transfer_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update transfer requests"
ON public.transfer_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_transfer_requests_user_id ON public.transfer_requests(user_id);

CREATE TRIGGER update_transfer_requests_updated_at
BEFORE UPDATE ON public.transfer_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();