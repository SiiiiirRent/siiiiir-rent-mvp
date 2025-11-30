"use client";

import { useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { PhotoType, CheckPhoto } from "@/lib/types";
import { uploadCheckPhoto } from "@/lib/checkinout";

interface PhotoUploadSectionProps {
  reservationId: string;
  userId: string;
  checkType: "checkin" | "checkout";
  onPhotosUpdate: (photos: CheckPhoto[]) => void;
}

const REQUIRED_PHOTOS: { type: PhotoType; label: string; required: boolean }[] =
  [
    { type: "avant", label: "📷 Avant du véhicule", required: true },
    { type: "arriere", label: "📷 Arrière du véhicule", required: true },
    { type: "cote_gauche", label: "📷 Côté gauche", required: true },
    { type: "cote_droit", label: "📷 Côté droit", required: true },
    { type: "interieur", label: "📷 Intérieur", required: true },
    { type: "kilometrage", label: "📷 Kilométrage", required: true },
    { type: "carburant", label: "📷 Niveau carburant", required: true },
    { type: "defauts", label: "📷 Défauts (optionnel)", required: false },
  ];

export default function PhotoUploadSection({
  reservationId,
  userId,
  checkType,
  onPhotosUpdate,
}: PhotoUploadSectionProps) {
  const [photos, setPhotos] = useState<CheckPhoto[]>([]);
  const [uploading, setUploading] = useState<Set<PhotoType>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${timestamp}] ${message}`].slice(-5)); // Garde les 5 derniers
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    photoType: PhotoType
  ) => {
    try {
      addDebugLog(`📸 Début ${photoType}`);

      if (!e.target.files || !e.target.files[0]) {
        alert("❌ Impossible de lire la photo. Réessayez.");
        return;
      }

      const file = e.target.files[0];

      if (file.size === 0) {
        alert("❌ Erreur : photo non valide (iOS). Prenez une nouvelle photo.");
        return;
      }

      setUploading((prev) => new Set([...prev, photoType]));
      setUploadProgress(`Compression ${photoType}...`);
      addDebugLog(`🔄 Compression ${photoType}...`);

      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1400,
        useWebWorker: true,
      });

      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
      addDebugLog(`✅ ${photoType}: ${originalSize}MB → ${compressedSize}MB`);

      setUploadProgress(`Upload ${photoType} (${compressedSize}MB)...`);
      addDebugLog(`⬆️ Upload ${photoType}...`);

      const uploadedPhoto = await uploadCheckPhoto(
        reservationId,
        compressedFile,
        photoType,
        checkType,
        userId
      );

      const updatedPhotos = [
        ...photos.filter((p) => p.type !== photoType),
        uploadedPhoto,
      ];

      setPhotos(updatedPhotos);
      onPhotosUpdate(updatedPhotos);

      addDebugLog(`✅ ${photoType} uploadé !`);
    } catch (error: any) {
      addDebugLog(`❌ Erreur ${photoType}: ${error.message}`);
      alert(
        `❌ Erreur lors de l'upload de la photo ${photoType}\n\nDétail : ${error.message}`
      );
    } finally {
      setUploading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(photoType);
        return newSet;
      });
      if (uploading.size <= 1) {
        setUploadProgress("");
      }
      e.target.value = "";
    }
  };

  const getPhotoUrl = (photoType: PhotoType): string | null => {
    return photos.find((p) => p.type === photoType)?.url || null;
  };

  const isPhotoUploaded = (photoType: PhotoType): boolean => {
    return photos.some((p) => p.type === photoType);
  };

  const allRequiredPhotosUploaded = (): boolean => {
    return REQUIRED_PHOTOS.filter((p) => p.required).every((p) =>
      isPhotoUploaded(p.type)
    );
  };

  const isPhotoUploading = (photoType: PhotoType): boolean => {
    return uploading.has(photoType);
  };

  const hasAnyUploading = uploading.size > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          📸 Photos obligatoires
        </h3>
        <p className="text-sm text-gray-600">
          Prenez des photos claires de toutes les parties du véhicule
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="font-medium">
            {
              photos.filter(
                (p) =>
                  REQUIRED_PHOTOS.find((rp) => rp.type === p.type)?.required
              ).length
            }{" "}
            / 7
          </span>
          <span className="text-gray-600">photos obligatoires</span>
        </div>

        {/* 🆕 DEBUG LOGS VISIBLES */}
        {debugLogs.length > 0 && (
          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-xs font-bold text-purple-900 mb-2">📝 Debug:</p>
            {debugLogs.map((log, i) => (
              <p key={i} className="text-xs text-purple-800 font-mono">
                {log}
              </p>
            ))}
          </div>
        )}

        {hasAnyUploading && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-800">
                {uploadProgress ||
                  `Upload en cours (${uploading.size} photo(s))...`}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REQUIRED_PHOTOS.map((photoSpec) => {
          const photoUrl = getPhotoUrl(photoSpec.type);
          const isUploaded = isPhotoUploaded(photoSpec.type);
          const isUploading = isPhotoUploading(photoSpec.type);

          return (
            <div
              key={photoSpec.type}
              className={`border-2 rounded-lg p-4 transition-colors ${
                isUploaded
                  ? "border-green-500 bg-green-50"
                  : isUploading
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-900">
                  {photoSpec.label}
                  {photoSpec.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {isUploading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
                {isUploaded && !isUploading && (
                  <span className="text-green-600">✅</span>
                )}
              </div>

              {photoUrl ? (
                <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <Image
                    src={photoUrl}
                    alt={photoSpec.label}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  {isUploading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-xs text-gray-600">Upload...</p>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-4xl">📷</span>
                  )}
                </div>
              )}

              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoUpload(e, photoSpec.type)}
                  disabled={isUploading}
                  className="hidden"
                />
                <div
                  className={`w-full px-4 py-2 rounded-lg text-center font-medium cursor-pointer transition-colors ${
                    isUploading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : isUploaded
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {isUploading
                    ? "⏳ Upload..."
                    : isUploaded
                      ? "🔄 Remplacer"
                      : "📸 Prendre photo"}
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {!allRequiredPhotosUploaded() && !hasAnyUploading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Veuillez prendre toutes les photos obligatoires avant de
            continuer
          </p>
        </div>
      )}
    </div>
  );
}
