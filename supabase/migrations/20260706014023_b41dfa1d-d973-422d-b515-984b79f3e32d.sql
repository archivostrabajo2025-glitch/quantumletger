
-- Ensure authenticated users can manage files within their own folder in identity-documents bucket
DROP POLICY IF EXISTS "Users can upload own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own identity documents" ON storage.objects;

CREATE POLICY "Users can upload own identity documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'identity-documents'
  AND auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Users can read own identity documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'identity-documents'
  AND auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Users can update own identity documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'identity-documents'
  AND auth.uid()::text = split_part(name, '/', 1)
)
WITH CHECK (
  bucket_id = 'identity-documents'
  AND auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Users can delete own identity documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'identity-documents'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- Admins can view all identity documents for verification
DROP POLICY IF EXISTS "Admins can read all identity documents" ON storage.objects;
CREATE POLICY "Admins can read all identity documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'identity-documents'
  AND public.has_role(auth.uid(), 'admin')
);
