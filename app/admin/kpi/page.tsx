"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import KpiCard from "@/components/admin/KpiCard";
import {
  ArrowLeft,
  TrendingUp,
  Percent,
  Users,
  Activity,
  MousePointerClick,
  BarChart3,
  Wallet,
} from "lucide-react";

interface InvestorKpiStats {
  gmvTotal: number;
  gmvLast30Days: number;
  gmvLast7Days: number;

  totalReservations: number;
  reservationsPayantes: number;
  confirmedReservations: number;
  cancelledReservations: number;

  totalLoueurs: number;
  totalLoueursActifs: number;
  totalLocataires: number;

  avgReservationValue: number; // panier moyen
  conversionRate: number; // confirmee / total
  cancellationRate: number; // annulee / total

  estimatedCommissionRevenue: number; // 5% GMV
  estimatedSubscriptionRevenue: number; // 99€/loueur/mois
  arpl: number; // revenu moyen par loueur (€/mois estimé)
}

interface TopLoueur {
  loueurId: string;
  name: string;
  email: string;
  ville?: string;
  totalReservations: number;
  gmv: number;
}

export default function AdminKpiPage() {
  const [stats, setStats] = useState<InvestorKpiStats | null>(null);
  const [topLoueurs, setTopLoueurs] = useState<TopLoueur[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKpis();
  }, []);

  const loadKpis = async () => {
    try {
      setLoading(true);

      // 1️⃣ Charger les users
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      const usersById = new Map<string, any>();
      usersData.forEach((u) => usersById.set(u.id, u));

      // 2️⃣ Charger les reservations
      const reservationsSnap = await getDocs(collection(db, "reservations"));
      const reservationsData = reservationsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      const now = new Date();
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      let gmvTotal = 0;
      let gmvLast30Days = 0;
      let gmvLast7Days = 0;

      let totalReservations = reservationsData.length;
      let reservationsPayantes = 0;
      let confirmedReservations = 0;
      let cancelledReservations = 0;

      const loueurStats: Record<
        string,
        { loueurId: string; reservations: number; gmv: number }
      > = {};

      reservationsData.forEach((r) => {
        const status = (r as any).status as string | undefined;
        const prix = (r as any).prixTotal ?? (r as any).totalPrice ?? 0;

        const createdAtRaw = (r as any).createdAt;
        const createdAt =
          createdAtRaw?.toDate?.() ??
          (createdAtRaw ? new Date(createdAtRaw as any) : null);

        // GMV globale
        gmvTotal += prix;

        // GMV sur 30 / 7 jours
        if (createdAt && createdAt >= d30) {
          gmvLast30Days += prix;
        }
        if (createdAt && createdAt >= d7) {
          gmvLast7Days += prix;
        }

        // Statuts
        if (status === "confirmee" || status === "terminee") {
          confirmedReservations += 1;
          reservationsPayantes += 1;
        }
        if (status === "annulee") {
          cancelledReservations += 1;
        }

        // Stats par loueur
        const loueurId = (r as any).loueurId as string | undefined;
        if (loueurId) {
          if (!loueurStats[loueurId]) {
            loueurStats[loueurId] = {
              loueurId,
              reservations: 0,
              gmv: 0,
            };
          }
          loueurStats[loueurId].reservations += 1;
          loueurStats[loueurId].gmv += prix;
        }
      });

      const totalLoueurs = usersData.filter((u) => u.role === "loueur").length;
      const totalLocataires = usersData.filter(
        (u) => u.role === "locataire"
      ).length;

      const totalLoueursActifs = Object.values(loueurStats).filter(
        (s) => s.reservations > 0
      ).length;

      const avgReservationValue =
        reservationsPayantes > 0 ? gmvTotal / reservationsPayantes : 0;

      const conversionRate =
        totalReservations > 0
          ? (confirmedReservations / totalReservations) * 100
          : 0;

      const cancellationRate =
        totalReservations > 0
          ? (cancelledReservations / totalReservations) * 100
          : 0;

      const estimatedCommissionRevenue = gmvTotal * 0.05; // 5%
      const estimatedSubscriptionRevenue = totalLoueurs * 99; // 99€/mois

      const arpl =
        totalLoueurs > 0
          ? (estimatedCommissionRevenue / 11 + estimatedSubscriptionRevenue) /
            totalLoueurs
          : 0;
      // (approx : on répartit les commissions annuelles sur 12 mois)

      // Top loueurs par GMV
      const topLoueursComputed: TopLoueur[] = Object.values(loueurStats)
        .sort((a, b) => b.gmv - a.gmv)
        .slice(0, 5)
        .map((s) => {
          const user = usersById.get(s.loueurId);
          return {
            loueurId: s.loueurId,
            name:
              user?.nom ||
              user?.displayName ||
              `${user?.prenom || ""} ${user?.nom || ""}`.trim() ||
              "Loueur",
            email: user?.email || "—",
            ville: user?.ville || user?.city || undefined,
            totalReservations: s.reservations,
            gmv: s.gmv,
          };
        });

      const newStats: InvestorKpiStats = {
        gmvTotal,
        gmvLast30Days,
        gmvLast7Days,
        totalReservations,
        reservationsPayantes,
        confirmedReservations,
        cancelledReservations,
        totalLoueurs,
        totalLoueursActifs,
        totalLocataires,
        avgReservationValue,
        conversionRate,
        cancellationRate,
        estimatedCommissionRevenue,
        estimatedSubscriptionRevenue,
        arpl,
      };

      setStats(newStats);
      setTopLoueurs(topLoueursComputed);
    } catch (error) {
      console.error("❌ Erreur chargement KPI investisseurs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4" />
        <p className="text-gray-600">Chargement des KPI avancés...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            KPI avancés – Investisseurs
          </h1>
          <p className="text-gray-600 mt-2">
            Vue business détaillée de SIIIIIR Rent (GMV, conversions,
            performance loueurs).
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au dashboard
        </Link>
      </div>

      {/* Bloc 1 – GMV & Traction */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Traction & GMV
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            title="GMV Total"
            value={`${stats.gmvTotal.toLocaleString()} DH`}
            icon="💰"
            color="green"
          />
          <KpiCard
            title="GMV 30 derniers jours"
            value={`${stats.gmvLast30Days.toLocaleString()} DH`}
            icon="📅"
            color="blue"
          />
          <KpiCard
            title="GMV 7 derniers jours"
            value={`${stats.gmvLast7Days.toLocaleString()} DH`}
            icon="📆"
            color="purple"
          />
        </div>
      </div>

      {/* Bloc 2 – Conversion / Annulation / Panier moyen */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MousePointerClick className="w-5 h-5 text-blue-600" />
          Conversion & Qualité des réservations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard
            title="Taux de conversion"
            value={`${stats.conversionRate.toFixed(1)} %`}
            icon="🎯"
            color="green"
          />
          <KpiCard
            title="Taux d'annulation"
            value={`${stats.cancellationRate.toFixed(1)} %`}
            icon="⚠️"
            color="red"
          />
          <KpiCard
            title="Panier moyen (par réservation)"
            value={`${Math.round(stats.avgReservationValue).toLocaleString()} DH`}
            icon="🧾"
            color="yellow"
          />
          <KpiCard
            title="Réservations payantes"
            value={stats.reservationsPayantes}
            icon="✅"
            color="blue"
          />
        </div>
      </div>

      {/* Bloc 3 – Base utilisateurs / revenus récurrents */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Base de clients & revenus récurrents estimés
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard
            title="Loueurs (total)"
            value={stats.totalLoueurs}
            icon="🏢"
            color="blue"
          />
          <KpiCard
            title="Loueurs actifs"
            value={stats.totalLoueursActifs}
            icon="🔥"
            color="green"
          />
          <KpiCard
            title="Locataires"
            value={stats.totalLocataires}
            icon="👤"
            color="purple"
          />
          <KpiCard
            title="ARPL estimé"
            value={`${Math.round(stats.arpl).toLocaleString()} €/mois`}
            icon="📦"
            color="yellow"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <KpiCard
            title="Revenus commissions (5%)"
            value={`${Math.round(
              stats.estimatedCommissionRevenue
            ).toLocaleString()} DH`}
            icon="💸"
            color="green"
          />
          <KpiCard
            title="Revenus abonnements (estimés)"
            value={`${stats.estimatedSubscriptionRevenue.toLocaleString()} €/mois`}
            icon="📈"
            color="blue"
          />
        </div>
      </div>

      {/* Bloc 4 – Top loueurs */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          Top loueurs par GMV
        </h2>
        {topLoueurs.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Aucun loueur actif pour le moment.
          </p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Loueur
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">
                    Ville
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">
                    Réservations
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">
                    GMV générée
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {topLoueurs.map((l) => (
                  <tr key={l.loueurId}>
                    <td className="px-6 py-3 text-gray-900">{l.name}</td>
                    <td className="px-6 py-3 text-gray-600">{l.email}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {l.ville || "—"}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-900">
                      {l.totalReservations}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-green-600">
                      {Math.round(l.gmv).toLocaleString()} DH
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bloc 5 – Rappel pitch investisseur */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-xl p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-green-700" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Lecture investisseur
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            Cette page te sert à raconter une histoire claire :{" "}
            <strong>taille de la base de loueurs</strong>,{" "}
            <strong>traction des réservations</strong>,{" "}
            <strong>GMV générée</strong> et{" "}
            <strong>revenus potentiels (commissions + abonnements)</strong>.
            Avec ces KPI, tu peux montrer où tu es aujourd&apos;hui et projeter
            facilement un scénario à 12–36 mois.
          </p>
        </div>
      </div>
    </div>
  );
}
