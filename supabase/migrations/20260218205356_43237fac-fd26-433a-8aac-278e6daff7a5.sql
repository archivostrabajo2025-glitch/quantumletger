
-- Add admin-controlled flags to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_fatca boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_activation_modal boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_custom_notification boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_notification_title text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_notification_message text DEFAULT NULL;
