"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import type { Reservation, Vehicle } from "@/lib/types";
import {
  calculateAnalytics,
  type AnalyticsData,
  exportToCSV,
} from "@/lib/analytics";

import StatsCard from "@/components/dashboard/StatsCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import TopVehicles from "@/components/dashboard/TopVehicles";

export default function RevenusPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Helper pour formater les dates (string, Date, Timestamp Firestore)
  const formatDate = (value: any): string => {
    if (!value) return "";
    if (value instanceof Date) {
      return value.toLocaleDateString("fr-FR");
    }
    if (typeof value.toDate === "function") {
      return value.toDate().toLocaleDateString("fr-FR");
    }
    return new Date(value).toLocaleDateString("fr-FR");
  };

  useEffect(() => {
    if (user?.uid) {
      void loadData(user.uid);
    } else {
      setLoading(false);
    }
  }, [user]);

  async function loadData(userId: string) {
    try {
      setLoading(true);

      // Charger les véhicules du loueur
      const vehiclesQuery = query(
        collection(db, "vehicles"),
        where("userId", "==", userId)
      );
      const vehiclesSnapshot = await getDocs(vehiclesQuery);
      const vehicles: Vehicle[] = vehiclesSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Vehicle[];

      // Charger les réservations du loueur
      const reservationsQuery = query(
        collection(db, "reservations"),
        where("loueurId", "==", userId)
      );
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservationsData: Reservation[] = reservationsSnapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          } as Reservation)
      );

      setReservations(reservationsData);

      // Calculer les analytics
      const analyticsData = calculateAnalytics(reservationsData, vehicles);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Erreur chargement analytics:", error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    if (reservations.length === 0) {
      alert("Aucune réservation à exporter");
      return;
    }

    const csv = exportToCSV(reservations);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservations_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-600" />
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">
          Impossible de charger les statistiques pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* En-tête */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Revenus &amp; Statistiques
          </h1>
          <p className="mt-1 text-gray-600">
            Vue d&apos;ensemble de vos performances
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3 3-3m2 8H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414A1 1 0 0 1 19 9.414V19a2 2 0 0 1-2 2z"
            />
          </svg>
          Exporter CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Revenus du mois"
          value={`${analytics.totalRevenue.toLocaleString("fr-FR")} MAD`}
          subtitle="Paiements confirmés"
          color="green"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
              />
            </svg>
          }
        />

        <StatsCard
          title="Réservations"
          value={analytics.totalReservations.toString()}
          subtitle="Ce mois"
          color="blue"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
              />
            </svg>
          }
        />

        <StatsCard
          title="Taux d'occupation"
          value={`${analytics.occupancyRate.toFixed(1)}%`}
          subtitle="Moyenne mensuelle"
          color="orange"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"
              />
            </svg>
          }
        />

        <StatsCard
          title="Revenu moyen"
          value={`${analytics.averageRevenue.toLocaleString("fr-FR")} MAD`}
          subtitle="Par réservation"
          color="purple"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8-8 8-4-4-6 6"
              />
            </svg>
          }
        />
      </div>

      {/* Graphique revenus mensuels */}
      <div className="mb-6">
        <RevenueChart monthlyRevenues={analytics.monthlyRevenues} />
      </div>

      {/* Top véhicules */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopVehicles vehicles={analytics.topVehiclesByRevenue} type="revenue" />
        <TopVehicles
          vehicles={analytics.topVehiclesByReservations}
          type="reservations"
        />
      </div>

      {/* Réservations récentes */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Réservations récentes
            </h3>
            <p className="text-sm text-gray-500">
              10 dernières réservations confirmées ou en cours
            </p>
          </div>
          <Link
            href="/dashboard/reservations"
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            Voir tout →
          </Link>
        </div>

        {analytics.recentReservations.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            Aucune réservation récente
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Véhicule
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Période
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentReservations.map((reservation) => {
                  const r: any = reservation;
                  const clientName =
                    r.nomLocataire ?? r.locataireNom ?? "Client inconnu";
                  const marque = r.vehiculeMarque ?? r.vehicleMarque ?? "";
                  const modele = r.vehiculeModele ?? r.vehicleModele ?? "";
                  const montant =
                    r.paiement?.montantTotal != null
                      ? Number(r.paiement.montantTotal).toLocaleString("fr-FR")
                      : "0";
                  const statut: string = r.statut ?? r.status ?? "en attente";

                  let badgeClass = "bg-yellow-100 text-yellow-800"; // défaut
                  if (statut === "confirmée" || statut === "confirmee") {
                    badgeClass = "bg-green-100 text-green-800";
                  } else if (statut === "en cours") {
                    badgeClass = "bg-blue-100 text-blue-800";
                  } else if (statut === "terminée" || statut === "terminee") {
                    badgeClass = "bg-gray-100 text-gray-800";
                  }

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-900">{clientName}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {marque} {modele}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(r.dateDebut)} - {formatDate(r.dateFin)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {montant} MAD
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
                        >
                          {statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
