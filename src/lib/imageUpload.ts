/**
 * Utilitários para upload de imagens no Supabase Storage
 */

import { supabase } from "./supabaseClient";

const BUCKET_NAME = "classificados";
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

  try {
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.name.split(".").pop();
    // Use flat naming: uploads/timestamp-random-originalname
    // This avoids nested directories which may cause 400 errors in some Supabase configs
    const originalName = file.name
      .replace(/\.[^/.]+$/, "") // Remove extension
      .substring(0, 20)           // Limit length
      .replace(/[^a-z0-9-]/gi, ""); // Keep only safe chars
    const fileName = `uploads/${timestamp}-${random}-${originalName}.${ext}`;

    // Upload do arquivo
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return {
        success: false,
        error: error.message || "Erro ao fazer upload da imagem",
      };
    }

    // Gerar URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro desconhecido",
    };
  }
}

/**
 * Delete image from storage
 */
export async function deleteClassifiedImage(imageUrl: string): Promise<boolean> {
  try {
    // Extrair path da URL pública
    const urlParts = imageUrl.split(`/${BUCKET_NAME}/`);
    if (urlParts.length !== 2) {
      console.error("Invalid image URL format");
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("Error deleting image:", error);
      return false;
    }

    return true;
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

  try {
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.name.split(".").pop();
    const originalName = file.name
      .replace(/\.[^/.]+$/, "") // Remove extension
      .substring(0, 20)           // Limit length
      .replace(/[^a-z0-9-]/gi, ""); // Keep only safe chars
    const fileName = `news/${timestamp}-${random}-${originalName}.${ext}`;

    // Upload do arquivo
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return {
        success: false,
        error: error.message || "Erro ao fazer upload da imagem",
      };
    }

    // Gerar URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro desconhecido",
    };
  }
}

/**
 * Delete news image from storage
 */
export async function deleteNewsImage(imageUrl: string): Promise<boolean> {
  try {
    // Extrair path da URL pública
    const urlParts = imageUrl.split(`/${BUCKET_NAME}/`);
    if (urlParts.length !== 2) {
      console.error("Invalid image URL format");
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("Error deleting news image:", error);
      return false;
    }

    return true;
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
