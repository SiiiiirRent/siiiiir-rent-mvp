"use client";

import { useParams, useRouter } from "next/navigation";
import ProtectedPublicRoute from "@/components/ProtectedPublicRoute";
import { usePublicLoueur } from "./hooks/usePublicLoueur";
import LoueurHeader from "./components/LoueurHeader";
import Filters from "./components/Filters";
import VehicleGrid from "./components/VehicleGrid";

export default function LoueurPublicPage() {
  const params = useParams();
  const router = useRouter();
  const loueurId = params.id as string;

  const {
    loueur,
    vehicles,
    filteredVehicles,
    blockedDates,
    filters,
    setFilters,
    loading,
    error,
    dateError,
  } = usePublicLoueur(loueurId);

  const handleVehicleClick = (vehicleId: string) => {
    router.push(`/loueur/${loueurId}/vehicule/${vehicleId}`);
  };

  // État de chargement
  if (loading) {
    return (
      <ProtectedPublicRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
          </div>
        </div>
      </ProtectedPublicRoute>
    );
  }

  // État d'erreur
  if (error || !loueur) {
    return (
      <ProtectedPublicRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || "Loueur non trouvé"}
            </h2>
            <button
              onClick={() => router.back()}
              className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </ProtectedPublicRoute>
    );
  }

  // Contenu principal
  return (
    <ProtectedPublicRoute>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header loueur */}
        <div className="mb-8">
          <LoueurHeader loueur={loueur} vehicleCount={vehicles.length} />
        </div>

        {/* Filtres */}
        <div className="mb-8">
          <Filters
            filters={filters}
            onFiltersChange={setFilters}
            blockedDates={blockedDates}
            dateError={dateError}
            resultCount={filteredVehicles.length}
          />
        </div>

        {/* Grille véhicules */}
        <VehicleGrid
          vehicles={filteredVehicles}
          onVehicleClick={handleVehicleClick}
          hasFilters={
            !!filters.dateDebut ||
            !!filters.dateFin ||
            filters.searchTerm !== "" ||
            filters.selectedType !== "all" ||
            filters.priceRange !== "all"
          }
        />
      </div>
    </ProtectedPublicRoute>
  );
}
