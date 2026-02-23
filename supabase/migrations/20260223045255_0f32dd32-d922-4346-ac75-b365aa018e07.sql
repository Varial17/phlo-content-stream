
-- Add image_url column to posts
ALTER TABLE public.posts ADD COLUMN image_url text;

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');

-- Allow public read
CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update post images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'post-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-images' AND auth.role() = 'authenticated');
