"use client";

import { UserProfile } from "@/lib/types";
import { MapPin, Star, Phone } from "lucide-react";

interface LoueurHeaderProps {
  loueur: UserProfile;
  vehicleCount: number;
}

export default function LoueurHeader({
  loueur,
  vehicleCount,
}: LoueurHeaderProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Photo profil */}
        <div className="flex-shrink-0">
          {loueur.photoURL ? (
            <img
              src={loueur.photoURL}
              alt={loueur.displayName || "Loueur"}
              className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-200">
              <span className="text-3xl text-green-600 font-bold">
                {loueur.displayName?.charAt(0).toUpperCase() || "L"}
              </span>
            </div>
          )}
        </div>

        {/* Informations */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {loueur.displayName || "Loueur"}
          </h1>

          {loueur.ville && (
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <MapPin className="w-4 h-4" />
              <span>{loueur.ville}</span>
            </div>
          )}

          <div className="flex items-center gap-4 mb-4">
            {/* Note (fake pour MVP) */}
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">4.8</span>
              <span className="text-sm text-gray-500">(125 avis)</span>
            </div>

            {/* Nombre véhicules */}
            <div className="text-sm text-gray-600">
              {vehicleCount} véhicule{vehicleCount > 1 ? "s" : ""}
            </div>
          </div>

          {loueur.telephone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{loueur.telephone}</span>
            </div>
          )}
        </div>

        {/* Bouton WhatsApp */}
        {loueur.telephone && (
          <a
            href={`https://wa.me/${loueur.telephone.replace(/\s/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
          >
            💬 Contacter
          </a>
        )}
      </div>
    </div>
  );
}
