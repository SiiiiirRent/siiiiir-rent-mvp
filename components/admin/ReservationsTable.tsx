"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Reservation {
  id: string;
  vehicleMarque?: string;
  vehicleModele?: string;
  locataireNom?: string;
  loueurNom?: string;
  status?: string;
  prixTotal?: number;
  dateDebut?: any;
  dateFin?: any;
  createdAt?: any;
}

interface ReservationsTableProps {
  reservations: Reservation[];
}

export default function ReservationsTable({
  reservations,
}: ReservationsTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");

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
        className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const filteredReservations =
    filter === "all"
      ? reservations
      : reservations.filter((r) => r.status === filter);

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("fr-FR");
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header avec filtres */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            📋 Toutes les Réservations
          </h2>
          <span className="text-sm text-gray-600">
            {filteredReservations.length} résultats
          </span>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "all"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Toutes ({reservations.length})
          </button>
          <button
            onClick={() => setFilter("en_attente")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "en_attente"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            En attente (
            {reservations.filter((r) => r.status === "en_attente").length})
          </button>
          <button
            onClick={() => setFilter("confirmee")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "confirmee"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Confirmées (
            {reservations.filter((r) => r.status === "confirmee").length})
          </button>
          <button
            onClick={() => setFilter("en_cours")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "en_cours"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            En cours (
            {reservations.filter((r) => r.status === "en_cours").length})
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Véhicule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Locataire
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReservations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Aucune réservation trouvée
                </td>
              </tr>
            ) : (
              filteredReservations.slice(0, 20).map((reservation) => (
                <tr
                  key={reservation.id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                    {reservation.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.vehicleMarque} {reservation.vehicleModele}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.locataireNom || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(reservation.dateDebut)} -{" "}
                    {formatDate(reservation.dateFin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {reservation.prixTotal?.toLocaleString() || "0"} DH
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(reservation.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() =>
                        router.push(`/admin/reservations/${reservation.id}`)
                      }
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Voir →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredReservations.length > 20 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
          Affichage des 20 premières réservations sur{" "}
          {filteredReservations.length}
        </div>
      )}
    </div>
  );
}
