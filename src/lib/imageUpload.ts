/**
 * Utilitários para upload de imagens no Supabase Storage
 */

import { supabase } from "./supabaseClient";
import { uploadFile, deleteFile, getBucketName } from "./uploadService";

const BUCKET_NAME = process.env.NEXT_PUBLIC_CLASSIFIED_BUCKET || "classificados";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validar arquivo antes de upload
 */
export function validateImageFile(file: File): string | null {
  if (!file) return "Nenhum arquivo selecionado";

  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Apenas PNG, JPEG e WebP são permitidos";
  }

  if (file.size > MAX_FILE_SIZE) {
    return `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }

  return null;
}

/**
 * Upload de imagem para Supabase Storage
 */
export async function uploadClassifiedImage(
  file: File,
  classifiedId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Validar arquivo
  const validationError = validateImageFile(file);
  if (validationError) {
    return { success: false, error: validationError };
  }

    // Delegate to unified upload service
    const res = await uploadFile('classified', classifiedId, file, { entityId: classifiedId });
    return { success: !!res.publicUrl, url: res.publicUrl || undefined, error: res.error || undefined };
}

/**
 * Delete image from storage
 */
export async function deleteClassifiedImage(imageUrl: string): Promise<boolean> {
  try {
    const r = await deleteFile(imageUrl);
    if (!r.success) {
      console.error('Error deleting image:', r.error);
    }
    return r.success;
  } catch (err) {
    console.error("Error deleting image:", err);
    return false;
  }
}

/**
 * Deletar todas as imagens de um classificado
 */
export async function deleteClassifiedImages(
  imageUrls: string[]
): Promise<boolean> {
  if (!imageUrls || imageUrls.length === 0) {
    return true;
  }

  try {
    const filePaths = imageUrls
      .map((url) => {
        const parts = url.split(`/${BUCKET_NAME}/`);
        return parts.length === 2 ? parts[1] : null;
      })
      .filter(Boolean) as string[];

    if (filePaths.length === 0) {
      return true;
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (error) {
      console.error("Error deleting images:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error deleting images:", err);
    return false;
  }
}

/**
 * Upload de imagem para notícias no Supabase Storage
 */
export async function uploadNewsImage(
  file: File,
  newsId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Validar arquivo
  const validationError = validateImageFile(file);
  if (validationError) {
    return { success: false, error: validationError };
  }

    const res = await uploadFile('news', newsId, file, { entityId: newsId });
    return { success: !!res.publicUrl, url: res.publicUrl || undefined, error: res.error || undefined };
}

/**
 * Delete news image from storage
 */
export async function deleteNewsImage(imageUrl: string): Promise<boolean> {
  try {
    const r = await deleteFile(imageUrl);
    if (!r.success) console.error('Error deleting news image:', r.error);
    return r.success;
  } catch (err) {
    console.error("Error deleting news image:", err);
    return false;
  }
}

/**
 * Deletar todas as imagens de uma notícia
 */
export async function deleteNewsImages(
  imageUrls: string[]
): Promise<boolean> {
  if (!imageUrls || imageUrls.length === 0) {
    return true;
  }

  try {
    const filePaths = imageUrls
      .map((url) => {
        const parts = url.split(`/${BUCKET_NAME}/`);
        return parts.length === 2 ? parts[1] : null;
      })
      .filter(Boolean) as string[];

    if (filePaths.length === 0) {
      return true;
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (error) {
      console.error("Error deleting news images:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error deleting news images:", err);
    return false;
  }
}
