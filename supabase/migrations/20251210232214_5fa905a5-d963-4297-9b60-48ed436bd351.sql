-- Add account number and routing number to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS id_document_number text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS routing_number text;

-- Generate unique account numbers for existing users
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number text;
  exists_check boolean;
BEGIN
  LOOP
    new_number := lpad(floor(random() * 10000000000)::text, 10, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE account_number = new_number) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_routing_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number text;
BEGIN
  new_number := '0210' || lpad(floor(random() * 100000)::text, 5, '0');
  RETURN new_number;
END;
$$;

-- Trigger to auto-generate account and routing numbers on profile creation
CREATE OR REPLACE FUNCTION public.set_account_numbers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_number IS NULL THEN
    NEW.account_number := generate_account_number();
  END IF;
  IF NEW.routing_number IS NULL THEN
    NEW.routing_number := generate_routing_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_account_numbers_trigger ON public.profiles;
CREATE TRIGGER set_account_numbers_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_account_numbers();

-- Update existing profiles with account numbers
UPDATE public.profiles 
SET account_number = generate_account_number(),
    routing_number = generate_routing_number()
WHERE account_number IS NULL;