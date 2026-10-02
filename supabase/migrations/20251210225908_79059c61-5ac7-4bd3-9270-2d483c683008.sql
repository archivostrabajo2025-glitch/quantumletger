-- Add new columns to profiles table for extended user information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS full_address TEXT,
ADD COLUMN IF NOT EXISTS birth_date TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS proof_of_address_type TEXT,
ADD COLUMN IF NOT EXISTS proof_of_address_url TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'savings';