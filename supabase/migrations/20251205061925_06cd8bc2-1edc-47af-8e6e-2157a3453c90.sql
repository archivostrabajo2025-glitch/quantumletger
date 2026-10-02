-- Add activation fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS activation_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS usdt_address text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_activated boolean DEFAULT false;