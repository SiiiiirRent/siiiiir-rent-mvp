"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProtectedPublicRoute from "@/components/ProtectedPublicRoute";
import { useVehiculeDetail } from "./hooks/useVehiculeDetail";
import VehiculeInfo from "./components/VehiculeInfo";
import ReservationForm from "./components/ReservationForm";

export default function VehiculeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loueurId = params.id as string;
  const vehicleId = params.vehicleId as string;

  const { vehicle, loueur, loading, error, currentUser } = useVehiculeDetail(
    loueurId,
    vehicleId
  );

  // Loading
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

  // Error
  if (error || !vehicle || !loueur) {
    return (
      <ProtectedPublicRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || "Véhicule non trouvé"}
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

  // Content
  return (
    <ProtectedPublicRoute>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Bouton retour */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        {/* Layout 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche : Formulaire */}
          <div className="lg:col-span-1">
            <ReservationForm
              vehicle={vehicle}
              loueurId={loueurId}
              currentUser={currentUser}
            />
          </div>

          {/* Colonne droite : Infos véhicule */}
          <div className="lg:col-span-2">
            <VehiculeInfo vehicle={vehicle} loueur={loueur} />
          </div>
        </div>
      </div>
    </ProtectedPublicRoute>
  );
}
