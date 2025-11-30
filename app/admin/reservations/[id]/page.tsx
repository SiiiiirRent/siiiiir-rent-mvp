"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservation();
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      const docRef = doc(db, "reservations", reservationId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setReservation({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("fr-FR");
  };

  const getStatusBadge = (status?: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> =
      {
        en_attente: {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "En attente",
        },
        confirmee: {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "Confirmée",
        },
        en_cours: {
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: "En cours",
        },
        terminee: {
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: "Terminée",
        },
        annulee: { bg: "bg-red-100", text: "text-red-800", label: "Annulée" },
      };

    const badge = badges[status || ""] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status || "N/A",
    };

    return (
      <span
        className={`px-4 py-2 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">❌ Réservation introuvable</p>
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="mt-4 text-green-600 hover:text-green-700"
        >
          ← Retour au dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="text-green-600 hover:text-green-700 mb-2 flex items-center gap-2"
          >
            ← Retour au dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Détails Réservation
          </h1>
          <p className="text-gray-600 mt-1">ID: {reservation.id}</p>
        </div>
        {getStatusBadge(reservation.status)}
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Véhicule */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🚗 Véhicule</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Marque & Modèle</p>
              <p className="text-lg font-semibold text-gray-900">
                {reservation.vehicleMarque} {reservation.vehicleModele}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Immatriculation</p>
              <p className="font-mono text-gray-900">
                {reservation.vehicleImmatriculation || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ville</p>
              <p className="text-gray-900">
                {reservation.vehicleVille || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Locataire */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">👤 Locataire</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Nom</p>
              <p className="text-lg font-semibold text-gray-900">
                {reservation.locataireNom || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-gray-900">
                {reservation.locataireEmail || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Téléphone</p>
              <p className="text-gray-900">
                {reservation.locataireTelephone || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dates et Prix */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📅 Dates & Prix
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600">Date début</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(reservation.dateDebut)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date fin</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(reservation.dateFin)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nombre de jours</p>
            <p className="text-lg font-semibold text-gray-900">
              {reservation.nombreJours || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Prix total</p>
            <p className="text-2xl font-bold text-green-600">
              {reservation.prixTotal?.toLocaleString() || 0} DH
            </p>
          </div>
        </div>
      </div>

      {/* Check-in */}
      {reservation.checkin && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📸 Check-in</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Kilométrage</p>
              <p className="text-lg font-semibold text-gray-900">
                {reservation.checkin.kilometrage?.toLocaleString() || "N/A"} km
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Carburant</p>
              <p className="text-lg font-semibold text-gray-900">
                {reservation.checkin.carburant || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Photos</p>
              <p className="text-lg font-semibold text-gray-900">
                {reservation.checkin.photos?.length || 0} photo(s)
              </p>
            </div>
          </div>

          {reservation.checkin.notes && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Remarques</p>
              <p className="text-gray-900 mt-1">{reservation.checkin.notes}</p>
            </div>
          )}

          {/* Photos check-in */}
          {reservation.checkin.photos &&
            reservation.checkin.photos.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-3">Photos du check-in</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {reservation.checkin.photos
                    .slice(0, 8)
                    .map((photo: any, index: number) => (
                      <div key={index} className="relative">
                        <img
                          src={photo.url}
                          alt={`Check-in ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <span className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
                          {photo.type}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Check-out */}
      {reservation.checkout && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📸 Check-out</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Kilométrage</p>
              <p className="text-lg font-semibold text-gray-900">
                {reservation.checkout.kilometrage?.toLocaleString() || "N/A"} km
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Carburant</p>
              <p className="text-lg font-semibold text-gray-900">
                {reservation.checkout.carburant || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Photos</p>
              <p className="text-lg font-semibold text-gray-900">
                {reservation.checkout.photos?.length || 0} photo(s)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
