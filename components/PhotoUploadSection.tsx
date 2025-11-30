"use client";

import { useState } from "react";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import {
  InspectionPhoto,
  InspectionType,
  PhotoCategory,
  photoCategoryLabels,
} from "@/lib/types";

interface PhotoUploadSectionProps {
  reservationId: string;
  inspectionType: InspectionType;
  photos: InspectionPhoto[];
  onPhotosChange: (photos: InspectionPhoto[]) => void;
}

/**
 * ✅ Compression des photos AVANT upload
 * - Limite la largeur à 1600px
 * - Qualité ~0.7
 * - Réduit énormément le poids => plus rapide sur iPhone
 */
async function optimizeImageFile(
  file: File,
  maxWidth = 1600,
  quality = 0.7
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const ratio = img.width / img.height;
      const width = Math.min(img.width, maxWidth);
      const height = width / ratio;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Impossible de créer le contexte canvas"));
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            return reject(new Error("Erreur de compression"));
          }

          const optimizedFile = new File([blob], file.name, {
            type: "image/jpeg",
          });

          resolve(optimizedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

export default function PhotoUploadSection({
  reservationId,
  inspectionType,
  photos,
  onPhotosChange,
}: PhotoUploadSectionProps) {
  const [uploadingCategory, setUploadingCategory] =
    useState<PhotoCategory | null>(null);

  const categories: PhotoCategory[] = [
    "avant",
    "arriere",
    "cote_gauche",
    "cote_droit",
    "interieur",
    "compteur",
    "autres",
  ];

  const handlePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: PhotoCategory
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // on double un peu la tolérance car on compresse derrière
      alert("L'image est trop grande (max 10MB)");
      return;
    }

    setUploadingCategory(category);

    try {
      // ✅ Compression avant upload
      const optimizedFile = await optimizeImageFile(file);

      const timestamp = Date.now();
      const ext = optimizedFile.name.split(".").pop() || "jpg";
      const fileName = `${category}_${timestamp}.${ext}`;
      const filePath = `inspections/${reservationId}/${inspectionType}/${category}/${fileName}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, optimizedFile);
      const downloadURL = await getDownloadURL(storageRef);

      const newPhoto: InspectionPhoto = {
        url: downloadURL,
        category: category,
        uploadedAt: new Date().toISOString(),
        uploadedBy: "loueur",
        storagePath: filePath,
      };

      onPhotosChange([...photos, newPhoto]);
    } catch (error) {
      console.error("Erreur upload photo:", error);
      alert("Erreur lors de l'upload de la photo");
    } finally {
      setUploadingCategory(null);
      e.target.value = "";
    }
  };

  const handleDeletePhoto = async (photo: InspectionPhoto) => {
    if (!confirm("Supprimer cette photo ?")) return;

    try {
      if (photo.storagePath) {
        const storageRef = ref(storage, photo.storagePath);
        await deleteObject(storageRef);
      }

      onPhotosChange(photos.filter((p) => p.url !== photo.url));
    } catch (error) {
      console.error("Erreur suppression photo:", error);
      alert("Erreur lors de la suppression de la photo");
    }
  };

  const getPhotosByCategory = (category: PhotoCategory) => {
    return photos.filter((p) => p.category === category);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <ImageIcon className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Photos du véhicule
          </h2>
          <p className="text-sm text-gray-600">
            Prenez des photos claires de toutes les parties du véhicule
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const categoryPhotos = getPhotosByCategory(category);
          const isUploading = uploadingCategory === category;

          return (
            <div
              key={category}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {photoCategoryLabels[category]}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {categoryPhotos.length} photo(s)
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      document
                        .getElementById(`photo-camera-${category}`)
                        ?.click()
                    }
                    disabled={isUploading}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">Prendre une photo</span>
                    <span className="sm:hidden">Photo</span>
                  </button>

                  <button
                    onClick={() =>
                      document
                        .getElementById(`photo-upload-${category}`)
                        ?.click()
                    }
                    disabled={isUploading}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Galerie</span>
                    <span className="sm:hidden">Galerie</span>
                  </button>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoChange(e, category)}
                    className="hidden"
                    id={`photo-camera-${category}`}
                  />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e, category)}
                    className="hidden"
                    id={`photo-upload-${category}`}
                  />
                </div>
              </div>

              {isUploading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-sm text-gray-600">
                    Upload en cours...
                  </span>
                </div>
              )}

              {categoryPhotos.length > 0 && !isUploading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {categoryPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.url}
                        alt={`${category} ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => handleDeletePhoto(photo)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {categoryPhotos.length === 0 && !isUploading && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune photo pour cette catégorie
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-medium">{photos.length}</span> photo(s) au total
        </p>
      </div>
    </div>
  );
}
