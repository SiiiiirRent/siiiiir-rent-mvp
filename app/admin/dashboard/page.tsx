"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import KpiCard from "@/components/admin/KpiCard";
import ReservationsTable from "@/components/admin/ReservationsTable";
import KycPendingList from "@/components/admin/KycPendingList";
import ChecksPendingList from "@/components/admin/ChecksPendingList";
import Link from "next/link";

interface DashboardStats {
  totalLoueurs: number;
  totalLocataires: number;
  totalVehicules: number;
  totalReservations: number;
  reservationsEnAttente: number;
  reservationsConfirmees: number;
  reservationsEnCours: number;
  kycEnAttente: number;
  checkinEnAttente: number;
  checkoutEnAttente: number;
  gmvTotal: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Charger users
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);

      // Charger vehicles
      const vehiclesSnap = await getDocs(collection(db, "vehicles"));

      // Charger reservations
      const reservationsSnap = await getDocs(collection(db, "reservations"));
      const reservationsData = reservationsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReservations(reservationsData);

      // GMV
      const gmv = reservationsData
        .filter((r: any) => r.status === "confirmee" || r.status === "terminee")
        .reduce((sum: number, r: any) => sum + (r.prixTotal || 0), 0);

      const dashboardStats: DashboardStats = {
        totalLoueurs: usersData.filter((u: any) => u.role === "loueur").length,
        totalLocataires: usersData.filter((u: any) => u.role === "locataire")
          .length,
        totalVehicules: vehiclesSnap.size,
        totalReservations: reservationsSnap.size,
        reservationsEnAttente: reservationsData.filter(
          (r: any) => r.status === "en_attente"
        ).length,
        reservationsConfirmees: reservationsData.filter(
          (r: any) => r.status === "confirmee"
        ).length,
        reservationsEnCours: reservationsData.filter(
          (r: any) => r.status === "en_cours"
        ).length,
        kycEnAttente: usersData.filter((u: any) => u.kycStatus === "pending")
          .length,
        checkinEnAttente: reservationsData.filter(
          (r: any) => r.checkStatus === "checkin_en_attente_validation"
        ).length,
        checkoutEnAttente: reservationsData.filter(
          (r: any) => r.checkStatus === "checkout_en_attente_validation"
        ).length,
        gmvTotal: gmv,
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error("❌ Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">❌ Erreur lors du chargement des données</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER + BOUTONS */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-2">
            Vue d'ensemble de la plateforme SIIIIIR Rent
          </p>
        </div>

        <div className="flex gap-3">
          {/* 🚀 BOUTON KPI avancés */}
          <Link
            href="/admin/kpi"
            className="px-5 py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition font-medium"
          >
            📊 KPI avancés
          </Link>

          {/* 📧 BOUTON EMAILS */}
          <Link
            href="/admin/emails"
            className="px-5 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-medium"
          >
            📩 Emails Utilisateurs
          </Link>
        </div>
      </div>

      {/* KPIs Principaux */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📊 Statistiques Globales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Loueurs"
            value={stats.totalLoueurs}
            icon="👤"
            color="blue"
          />
          <KpiCard
            title="Total Locataires"
            value={stats.totalLocataires}
            icon="🚗"
            color="green"
          />
          <KpiCard
            title="Véhicules"
            value={stats.totalVehicules}
            icon="🚙"
            color="yellow"
          />
          <KpiCard
            title="Réservations"
            value={stats.totalReservations}
            icon="📋"
            color="gray"
          />
        </div>
      </div>

      {/* KPIs Réservations */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📋 Réservations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            title="En Attente"
            value={stats.reservationsEnAttente}
            icon="⏳"
            color="yellow"
          />
          <KpiCard
            title="Confirmées"
            value={stats.reservationsConfirmees}
            icon="✅"
            color="green"
          />
          <KpiCard
            title="En Cours"
            value={stats.reservationsEnCours}
            icon="🚗"
            color="blue"
          />
        </div>
      </div>

      {/* KPIs Business */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">💰 Business</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            title="GMV Total"
            value={`${stats.gmvTotal.toLocaleString()} DH`}
            icon="💵"
            color="green"
          />
          <KpiCard
            title="Commissions (5%)"
            value={`${(stats.gmvTotal * 0.05).toLocaleString()} DH`}
            icon="💰"
            color="green"
          />
          <KpiCard
            title="Revenus Abonnements"
            value={`${(stats.totalLoueurs * 99).toLocaleString()} €`}
            icon="📦"
            color="blue"
          />
        </div>
      </div>

      {/* KPIs Risque & Conformité */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          ⚠️ Risque & Conformité
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            title="KYC En Attente"
            value={stats.kycEnAttente}
            icon="📄"
            color="yellow"
          />
          <KpiCard
            title="Check-in à Valider"
            value={stats.checkinEnAttente}
            icon="📸"
            color="yellow"
          />
          <KpiCard
            title="Check-out à Valider"
            value={stats.checkoutEnAttente}
            icon="📸"
            color="yellow"
          />
        </div>
      </div>

      <ChecksPendingList reservations={reservations} />

      <KycPendingList users={users} />

      <ReservationsTable reservations={reservations} />

      <div className="flex justify-center">
        <button
          onClick={loadStats}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          🔄 Actualiser
        </button>
      </div>
    </div>
  );
}
