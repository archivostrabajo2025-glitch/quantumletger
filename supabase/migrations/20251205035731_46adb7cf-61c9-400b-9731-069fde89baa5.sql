-- Create storage bucket for identity documents
INSERT INTO storage.buckets (id, name, public) VALUES ('identity-documents', 'identity-documents', false);

-- Add verification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS id_document_url text,
ADD COLUMN IF NOT EXISTS selfie_url text,
ADD COLUMN IF NOT EXISTS verification_submitted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verification_notes text;

-- Storage policies for identity documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'identity-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'identity-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all identity documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'identity-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);