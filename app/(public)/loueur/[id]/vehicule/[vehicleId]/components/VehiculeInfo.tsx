"use client";

import { Vehicle, UserProfile } from "@/lib/types";
import { MapPin, User } from "lucide-react";

interface VehiculeInfoProps {
  vehicle: Vehicle;
  loueur: UserProfile;
}

export default function VehiculeInfo({ vehicle, loueur }: VehiculeInfoProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      {/* Photos */}
      {vehicle.photos && vehicle.photos.length > 0 && (
        <div className="mb-6">
          <img
            src={vehicle.photos[0]}
            alt={`${vehicle.marque} ${vehicle.modele}`}
            className="w-full h-96 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Titre */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {vehicle.marque} {vehicle.modele}
      </h1>

      {/* Badges + Specs */}
      <div className="flex items-center gap-4 text-gray-600 mb-6">
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          {vehicle.type}
        </span>
        <span>{vehicle.annee}</span>
        <span>{vehicle.transmission}</span>
        <span>{vehicle.carburant}</span>
        <span>{vehicle.places} places</span>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Description</h3>
        <p className="text-gray-600">
          {vehicle.description || "Aucune description disponible."}
        </p>
      </div>

      {/* Prix */}
      <div className="border-t pt-6 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Prix par jour</span>
          <div className="text-right">
            <span className="text-4xl font-bold text-green-600">
              {vehicle.prix}
            </span>
            <span className="text-gray-600 ml-2">MAD</span>
          </div>
        </div>
      </div>

      {/* Loueur */}
      <div className="border-t pt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Proposé par</h3>
        <div className="flex items-center gap-4">
          {loueur.photoURL ? (
            <img
              src={loueur.photoURL}
              alt={loueur.displayName || "Loueur"}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <User className="w-8 h-8 text-green-600" />
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900">
              {loueur.displayName || "Loueur"}
            </p>
            {loueur.ville && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {loueur.ville}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
