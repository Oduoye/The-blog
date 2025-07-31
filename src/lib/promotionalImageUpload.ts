import { supabase } from '@/integrations/supabase/client';

export const uploadPromotionalImage = async (file: File): Promise<string> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    console.log('=== PROMOTIONAL IMAGE UPLOAD ===');
    console.log('File details:', { name: file.name, size: file.size, type: file.type });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be signed in to upload images');
    }

    console.log('✓ User authenticated:', user.email);

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    console.log('Uploading promotional image:', fileName);

    // Upload the file to 'promotional-images' bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('promotional-images') // Updated bucket name
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('promotional-images') // Updated bucket name
      .getPublicUrl(fileName);

    if (!urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    console.log('✓ Promotional image uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error: any) {
    console.error('=== PROMOTIONAL IMAGE UPLOAD FAILED ===');
    console.error('Error details:', error);
    throw error;
  }
};

export const deletePromotionalImage = async (url: string): Promise<void> => {
  try {
    console.log('Deleting promotional image:', url);
    
    // Extract file path from URL
    // Assumes URL format like: https://[project_ref].supabase.co/storage/v1/object/public/promotional-images/filename.ext
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1]; // Get just the filename

    const { error } = await supabase.storage
      .from('promotional-images') // Updated bucket name
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    console.log('✓ Promotional image deleted successfully');
  } catch (error: any) {
    console.error('Promotional image delete error:', error);
    throw error;
  }
};
