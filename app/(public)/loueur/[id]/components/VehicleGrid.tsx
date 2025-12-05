"use client";

import { Vehicle } from "@/lib/types";

interface VehicleGridProps {
  vehicles: Vehicle[];
  onVehicleClick: (vehicleId: string) => void;
  hasFilters: boolean;
}

export default function VehicleGrid({
  vehicles,
  onVehicleClick,
  hasFilters,
}: VehicleGridProps) {
  // État vide
  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <div className="text-6xl mb-4">🚗</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Aucun véhicule disponible
        </h2>
        <p className="text-gray-600">
          {hasFilters
            ? "Aucun véhicule ne correspond à vos critères. Modifiez vos filtres."
            : "Ce loueur n'a pas encore ajouté de véhicules."}
        </p>
      </div>
    );
  }

  // Grille véhicules
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onClick={() => onVehicleClick(vehicle.id)}
        />
      ))}
    </div>
  );
}

// Composant VehicleCard (intégré)
interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
}

function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Photo */}
      <div className="relative h-48 bg-gray-200">
        {vehicle.photos && vehicle.photos.length > 0 ? (
          <img
            src={vehicle.photos[0]}
            alt={`${vehicle.marque} ${vehicle.modele}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🚗</span>
          </div>
        )}

        {/* Badge type */}
        <div className="absolute top-3 right-3 px-3 py-1 bg-white rounded-full text-sm font-medium shadow-sm">
          {vehicle.type}
        </div>
      </div>

      {/* Informations */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {vehicle.marque} {vehicle.modele}
        </h3>

        {/* Caractéristiques */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span>{vehicle.transmission}</span>
          <span>{vehicle.carburant}</span>
          <span>{vehicle.places} places</span>
        </div>

        {/* Prix et bouton */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-3xl font-bold text-green-600">
              {vehicle.prix}
            </span>
            <span className="text-gray-600 ml-1">MAD/j</span>
          </div>

          <div className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">
            Réserver
          </div>
        </div>
      </div>
    </div>
  );
}
