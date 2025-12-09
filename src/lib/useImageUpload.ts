/**
 * Hook para gerenciar upload de imagens para Supabase Storage
 */

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type UploadProgress = {
  [key: string]: number; // filename -> percentage
};

interface UseImageUploadOptions {
  bucket?: string;
  folder?: string;
  maxFileSize?: number; // bytes
  allowedMimeTypes?: string[];
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    bucket = "classificados",
    folder = "uploads",
    maxFileSize = 5242880, // 5MB
    allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (file: File, customPath?: string): Promise<string | null> => {
      setError(null);

      // Validar arquivo
      if (!allowedMimeTypes.includes(file.type)) {
        const msg = `Formato de arquivo não permitido. Use: ${allowedMimeTypes.join(", ")}`;
        setError(msg);
        return null;
      }

      if (file.size > maxFileSize) {
        const msg = `Arquivo muito grande. Máximo: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`;
        setError(msg);
        return null;
      }

      setUploading(true);
      setProgress((prev) => ({ ...prev, [file.name]: 0 }));

      try {
        // Gerar path único
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const filename = `${timestamp}-${random}-${file.name}`;
        const filepath = customPath || `${folder}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${filename}`;

        // Upload do arquivo
        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filepath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        // Gerar URL pública
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filepath);
        const publicUrl = publicUrlData?.publicUrl;

        setProgress((prev) => ({ ...prev, [file.name]: 100 }));
        setUploading(false);

        return publicUrl || null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao fazer upload";
        setError(msg);
        setUploading(false);
        return null;
      }
    },
    [bucket, folder, maxFileSize, allowedMimeTypes]
  );

  const uploadMultiple = useCallback(
    async (files: File[]): Promise<string[]> => {
      const urls: string[] = [];

      for (const file of files) {
        const url = await uploadImage(file);
        if (url) {
          urls.push(url);
        }
      }

      return urls;
    },
    [uploadImage]
  );

  const deleteImage = useCallback(
    async (publicUrl: string): Promise<boolean> => {
      try {
        // Extrair path da URL pública
        const urlParts = publicUrl.split(`${bucket}/`);
        if (urlParts.length < 2) {
          throw new Error("URL inválida");
        }

        const filepath = decodeURIComponent(urlParts[1]);

        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([filepath]);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao deletar imagem";
        setError(msg);
        return false;
      }
    },
    [bucket]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadImage,
    uploadMultiple,
    deleteImage,
    clearError,
  };
}
