-- Create table for affiliated bank accounts
CREATE TABLE public.affiliated_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  country TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.affiliated_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own affiliated account
CREATE POLICY "Users can view their own affiliated bank account"
ON public.affiliated_bank_accounts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own affiliated account
CREATE POLICY "Users can insert their own affiliated bank account"
ON public.affiliated_bank_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own affiliated account
CREATE POLICY "Users can update their own affiliated bank account"
ON public.affiliated_bank_accounts
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all affiliated accounts
CREATE POLICY "Admins can view all affiliated bank accounts"
ON public.affiliated_bank_accounts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all affiliated accounts
CREATE POLICY "Admins can update all affiliated bank accounts"
ON public.affiliated_bank_accounts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_affiliated_bank_accounts_updated_at
BEFORE UPDATE ON public.affiliated_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();