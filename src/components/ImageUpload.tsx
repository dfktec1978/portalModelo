"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  uploadClassifiedImage,
  deleteClassifiedImage,
  validateImageFile,
} from "@/lib/imageUpload";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

export default function ImageUpload({
  images,
  onImagesChange,
  disabled = false,
  maxImages = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    // Validar limite de imagens
    if (images.length >= maxImages) {
      setError(`Máximo de ${maxImages} imagens atingido`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        if (images.length + i >= maxImages) {
          setError(`Máximo de ${maxImages} imagens. ${i} imagem(ns) não foi(foram) adicionada(s).`);
          break;
        }

        const file = files[i];

        // Validar arquivo
        const validationError = validateImageFile(file);
        if (validationError) {
          setError(`${file.name}: ${validationError}`);
          continue;
        }

        // Fazer upload (usando um ID temporário)
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const result = await uploadClassifiedImage(file, tempId);

        if (result.success && result.url) {
          onImagesChange([...images, result.url]);
        } else {
          setError(`${file.name}: ${result.error}`);
        }
      }
    } finally {
      setUploading(false);
      // Limpar input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleRemoveImage(imageUrl: string) {
    setError(null);
    const deleted = await deleteClassifiedImage(imageUrl);

    if (deleted) {
      onImagesChange(images.filter((img) => img !== imageUrl));
    } else {
      setError("Erro ao deletar imagem");
    }
  }

  function handleDrag(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files);
    }
  }

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
            dragActive
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400"
          } ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleUpload(e.currentTarget.files)}
            disabled={disabled || uploading}
            className="hidden"
          />

          <div className="space-y-2">
            <div className="text-4xl">🖼️</div>
            <h4 className="font-semibold text-gray-700">
              {uploading ? "Fazendo upload..." : "Arraste imagens ou clique"}
            </h4>
            <p className="text-sm text-gray-500">
              PNG, JPEG ou WebP até 5MB
              {maxImages > 1 && ` (máximo ${maxImages})`}
            </p>
            <p className="text-xs text-gray-400 mt-3">
              {images.length} de {maxImages} imagens
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">
            Imagens adicionadas ({images.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={`Imagem ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(imageUrl)}
                  disabled={uploading}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                  title="Deletar imagem"
                >
                  ✕
                </button>

                {/* Image Number */}
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Text */}
      {images.length > 0 && canAddMore && (
        <p className="text-xs text-gray-500">
          Clique no &quot;X&quot; para remover uma imagem, ou adicione mais acima.
        </p>
      )}
    </div>
  );
}
