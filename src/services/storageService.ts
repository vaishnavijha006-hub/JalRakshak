// JalRakshak — Cloud Photo Storage Service
// Handles photo validation, unique storage paths, uploads to 'incident-photos', and cleanup

import { supabase } from '../lib/supabase';

export const PHOTO_BUCKET = 'incident-photos';
export const STORAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
};

export interface UploadPhotoResult {
  url: string | null;
  path: string | null;
  error: string | null;
}

/**
 * Validates file type, extension alignment, and size before sending to storage.
 */
export function validateStorageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type}". Allowed formats: JPG, PNG, WebP, GIF.`,
    };
  }

  const allowedExts = MIME_TO_EXTENSIONS[file.type] || [];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `File extension ".${ext}" does not match declared MIME type "${file.type}".`,
    };
  }

  if (file.size > STORAGE_MAX_BYTES) {
    return {
      valid: false,
      error: `Photo exceeds 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`,
    };
  }
  return { valid: true };
}

export const validatePhotoFile = validateStorageFile;

/**
 * Generates a unique, collision-proof path under the incident's directory.
 */
export function generateStoragePath(incidentId: string, filename: string): string {
  const sanitizedId = incidentId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileExt = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const sanitizedName = filename
    .replace(/\.[^/.]+$/, '')
    .replace(/\.+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  return `incidents/${sanitizedId}/${timestamp}_${randomSuffix}_${sanitizedName}.${fileExt}`;
}

/**
 * Uploads an incident photograph to Supabase Storage.
 * Generates a unique, collision-proof path under the incident's directory.
 */
export async function uploadIncidentPhoto(
  file: File,
  incidentId: string
): Promise<UploadPhotoResult> {
  const validation = validateStorageFile(file);
  if (!validation.valid) {
    return { url: null, path: null, error: validation.error || 'Invalid file' };
  }

  if (!supabase) {
    // Graceful fallback for unconfigured/demo mode: return data-URL without cloud upload
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          path: `local_demo_${Date.now()}_${file.name}`,
          error: null,
        });
      };
      reader.onerror = () => {
        resolve({ url: null, path: null, error: 'Failed to read local file.' });
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    const storagePath = generateStoragePath(incidentId, file.name);

    const { data, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.warn('Storage upload error:', error.message);
      return { url: null, path: null, error: `Upload failed: ${error.message}` };
    }

    // In secure private bucket mode, generate an authorized signed URL
    const { data: signedUrlData, error: signErr } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1-year access URL for authorized client

    if (signErr) {
      console.warn('Signed URL generation error, falling back to public URL:', signErr.message);
      const { data: publicUrlData } = supabase.storage
        .from(PHOTO_BUCKET)
        .getPublicUrl(data.path);

      return {
        url: publicUrlData.publicUrl,
        path: data.path,
        error: null,
      };
    }

    return {
      url: signedUrlData.signedUrl,
      path: data.path,
      error: null,
    };
  } catch (err: any) {
    return {
      url: null,
      path: null,
      error: err?.message || 'Network error during photo upload.',
    };
  }
}

/**
 * Generates an authorized signed URL for a photo in the private storage bucket.
 */
export async function getPhotoSignedUrl(storagePath: string, expiresIn = 3600): Promise<string | null> {
  if (!supabase || storagePath.startsWith('local_demo_')) return null;
  try {
    const { data, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.warn('Failed to generate signed URL:', error.message);
      return null;
    }
    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Removes an uploaded photograph if an incident insert fails or photo is replaced.
 * Validates reporter ownership when reporterId is provided.
 */
export async function deleteIncidentPhoto(
  storagePath: string,
  reporterId?: string
): Promise<boolean> {
  if (!supabase || storagePath.startsWith('local_demo_')) return true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (reporterId && session && session.user.id !== reporterId) {
      console.warn('Unauthorized attempt to delete incident photo: caller is not reporter');
      return false;
    }

    const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
    if (error) {
      console.warn('Failed to delete photo from storage:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error deleting photo:', err);
    return false;
  }
}
