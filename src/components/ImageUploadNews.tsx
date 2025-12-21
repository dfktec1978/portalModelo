"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  uploadNewsImage,
  deleteNewsImage,
  validateImageFile,
} from "@/lib/imageUpload";

interface ImageUploadNewsProps {
  images: string[];
  heroImageIndex: number;
  onImagesChange: (images: string[]) => void;
  onHeroImageChange: (index: number) => void;
  disabled?: boolean;
  maxImages?: number;
}

export default function ImageUploadNews({
  images,
  heroImageIndex,
  onImagesChange,
  onHeroImageChange,
  disabled = false,
  maxImages = 5,
}: ImageUploadNewsProps) {
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
      const newImages = [...images];
      let uploadedCount = 0;

      for (let i = 0; i < files.length; i++) {
        if (newImages.length >= maxImages) {
          setError(`Máximo de ${maxImages} imagens. ${files.length - i} imagem(ns) não foi(foram) adicionada(s).`);
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
        const result = await uploadNewsImage(file, tempId);

        if (result.success && result.url) {
          newImages.push(result.url);
          uploadedCount++;
        } else {
          setError(`${file.name}: ${result.error}`);
        }
      }

      // Atualizar todas as imagens de uma vez
      if (uploadedCount > 0) {
        onImagesChange(newImages);
      }
    } catch (err: any) {
      setError("Erro ao processar arquivos: " + err.message);
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
    const deleted = await deleteNewsImage(imageUrl);

    if (deleted) {
      const newImages = images.filter((img) => img !== imageUrl);
      onImagesChange(newImages);

      // Ajustar heroImageIndex se necessário
      const removedIndex = images.indexOf(imageUrl);
      if (removedIndex < heroImageIndex) {
        onHeroImageChange(Math.max(0, heroImageIndex - 1));
      } else if (removedIndex === heroImageIndex) {
        onHeroImageChange(Math.min(heroImageIndex, newImages.length - 1));
      }
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
            Imagens ({images.length}/{maxImages})
            {heroImageIndex >= 0 && images.length > 0 && (
              <span className="text-sm text-blue-600 ml-2">
                • Imagem principal: {heroImageIndex + 1}
              </span>
            )}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div
                  className={`relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden border-2 ${
                    heroImageIndex === index
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-300"
                  }`}
                >
                  <Image
                    src={imageUrl}
                    alt={`Imagem ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Indicador de imagem principal */}
                {heroImageIndex === index && (
                  <div className="absolute -top-2 -left-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    ⭐
                  </div>
                )}

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

                {/* Set as Hero Button */}
                {heroImageIndex !== index && (
                  <button
                    type="button"
                    onClick={() => onHeroImageChange(index)}
                    disabled={uploading}
                    className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                    title="Definir como imagem principal"
                  >
                    ⭐
                  </button>
                )}

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
          ⭐ = Definir como principal • ✕ = Remover imagem • Arraste mais imagens acima.
        </p>
      )}
    </div>
  );
}