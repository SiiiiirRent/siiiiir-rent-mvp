"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckPhoto, PhotoType } from "@/lib/types";

interface ComparisonViewerProps {
  checkinPhotos: CheckPhoto[];
  checkoutPhotos: CheckPhoto[];
}

const PHOTO_TYPES: { type: PhotoType; label: string }[] = [
  { type: "avant", label: "Avant" },
  { type: "arriere", label: "Arrière" },
  { type: "cote_gauche", label: "Côté gauche" },
  { type: "cote_droit", label: "Côté droit" },
  { type: "interieur", label: "Intérieur" },
  { type: "kilometrage", label: "Kilométrage" },
  { type: "carburant", label: "Carburant" },
  { type: "defauts", label: "Défauts" },
];

export default function ComparisonViewer({
  checkinPhotos,
  checkoutPhotos,
}: ComparisonViewerProps) {
  const [selectedType, setSelectedType] = useState<PhotoType>("avant");

  const getPhotoUrl = (
    photos: CheckPhoto[],
    type: PhotoType
  ): string | null => {
    const photo = photos.find((p) => p.type === type);
    return photo?.url || null;
  };

  const checkinUrl = getPhotoUrl(checkinPhotos, selectedType);
  const checkoutUrl = getPhotoUrl(checkoutPhotos, selectedType);

  return (
    <div className="space-y-4">
      {/* Sélecteur de type de photo */}
      <div className="flex flex-wrap gap-2">
        {PHOTO_TYPES.map((photoType) => {
          const hasCheckin = getPhotoUrl(checkinPhotos, photoType.type);
          const hasCheckout = getPhotoUrl(checkoutPhotos, photoType.type);

          return (
            <button
              key={photoType.type}
              onClick={() => setSelectedType(photoType.type)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                selectedType === photoType.type
                  ? "bg-green-600 text-white"
                  : hasCheckin && hasCheckout
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : hasCheckin || hasCheckout
                      ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {photoType.label}
              {hasCheckin && hasCheckout
                ? " ✅"
                : hasCheckin || hasCheckout
                  ? " ⚠️"
                  : ""}
            </button>
          );
        })}
      </div>

      {/* Comparaison côte à côte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Check-in */}
        <div className="border-2 border-blue-500 rounded-lg overflow-hidden">
          <div className="bg-blue-500 text-white px-4 py-2 font-semibold text-center">
            📷 Check-in (Entrée)
          </div>
          <div className="relative w-full h-64 md:h-80 bg-gray-100">
            {checkinUrl ? (
              <Image
                src={checkinUrl}
                alt={`Check-in ${selectedType}`}
                fill
                className="object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Aucune photo</p>
              </div>
            )}
          </div>
        </div>

        {/* Check-out */}
        <div className="border-2 border-green-500 rounded-lg overflow-hidden">
          <div className="bg-green-500 text-white px-4 py-2 font-semibold text-center">
            📷 Check-out (Sortie)
          </div>
          <div className="relative w-full h-64 md:h-80 bg-gray-100">
            {checkoutUrl ? (
              <Image
                src={checkoutUrl}
                alt={`Check-out ${selectedType}`}
                fill
                className="object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Aucune photo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
