"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Reservation, Vehicle, Payment } from "@/lib/types";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  Car,
  Clock,
} from "lucide-react";
import Link from "next/link";

// ✅ COMPOSANT BADGE KYC
function KycBadge({ userId }: { userId?: string }) {
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadKycStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setKycStatus(userData.kycStatus || "pending");
        }
      } catch (error) {
        console.error("Erreur chargement KYC:", error);
      } finally {
        setLoading(false);
      }
    };

    loadKycStatus();
  }, [userId]);

  if (loading) return null;

  if (kycStatus === "verified") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
        <span>✅ KYC Vérifié</span>
      </div>
    );
  }

  if (kycStatus === "rejected") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
        <span>❌ KYC Refusé</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
      <span>⏳ KYC En attente</span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger les réservations
      const reservationsQuery = query(
        collection(db, "reservations"),
        where("loueurId", "==", user.uid)
      );
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservationsData = reservationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];

      // Charger les véhicules
      const vehiclesQuery = query(
        collection(db, "vehicles"),
        where("userId", "==", user.uid)
      );
      const vehiclesSnapshot = await getDocs(vehiclesQuery);
      const vehiclesData = vehiclesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Vehicle[];

      // Charger les paiements
      const paymentsQuery = query(collection(db, "payments"));
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const paymentsData = paymentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Payment[];

      // Filtrer les paiements pour ce loueur
      const userPayments = paymentsData.filter((payment) =>
        reservationsData.some((res) => res.id === payment.reservationId)
      );

      setReservations(reservationsData);
      setVehicles(vehiclesData);
      setPayments(userPayments);
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculs des KPIs
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const revenusThisMonth = payments
    .filter((payment) => {
      const date = payment.datePaiement?.toDate
        ? payment.datePaiement.toDate()
        : new Date(payment.datePaiement);
      return (
        payment.status === "paye" &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    })
    .reduce((sum, payment) => sum + payment.montant, 0);

  const reservationsThisMonth = reservations.filter((res) => {
    const date = res.createdAt?.toDate
      ? res.createdAt.toDate()
      : new Date(res.createdAt);
    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  }).length;

  const activeReservations = reservations.filter(
    (res) => res.status === "en_cours" || res.status === "confirmee"
  ).length;

  const paiementsEnAttente = reservations.filter(
    (res) =>
      res.status === "confirmee" &&
      (!res.paymentStatus || res.paymentStatus === "non_paye")
  ).length;

  // Top 5 véhicules
  const vehicleReservationCounts = vehicles.map((vehicle) => {
    const count = reservations.filter(
      (res) =>
        res.vehicleId === vehicle.id &&
        (res.status === "terminee" || res.status === "en_cours")
    ).length;
    return { vehicle, count };
  });

  const topVehicles = vehicleReservationCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Dernières réservations
  const recentReservations = [...reservations]
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  // Revenus des 6 derniers mois
  const getLast6MonthsRevenue = () => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("fr-FR", { month: "short" });
      const year = date.getFullYear();

      const revenue = payments
        .filter((payment) => {
          const paymentDate = payment.datePaiement?.toDate
            ? payment.datePaiement.toDate()
            : new Date(payment.datePaiement);
          return (
            payment.status === "paye" &&
            paymentDate.getMonth() === date.getMonth() &&
            paymentDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, payment) => sum + payment.montant, 0);

      months.push({
        month: `${monthName} ${year}`,
        revenue,
      });
    }

    return months;
  };

  const monthlyRevenue = getLast6MonthsRevenue();
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);

  const getStatusBadge = (status: string) => {
    const styles = {
      en_attente: "bg-yellow-100 text-yellow-800",
      confirmee: "bg-blue-100 text-blue-800",
      en_cours: "bg-green-100 text-green-800",
      terminee: "bg-gray-100 text-gray-800",
      annulee: "bg-red-100 text-red-800",
    };

    const labels = {
      en_attente: "En attente",
      confirmee: "Confirmée",
      en_cours: "En cours",
      terminee: "Terminée",
      annulee: "Annulée",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header avec Badge KYC */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Vue d'ensemble
          </h1>
          {/* ✅ BADGE KYC */}
          <KycBadge userId={user?.uid} />
        </div>
        <p className="text-gray-600 mt-1">
          Bienvenue {user?.displayName || user?.email} 👋
        </p>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Revenus du mois */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">Ce mois</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {revenusThisMonth.toFixed(0)} MAD
          </h3>
          <p className="text-sm text-gray-600 mt-1">Revenus</p>
        </div>

        {/* Réservations du mois */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">Ce mois</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {reservationsThisMonth}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Réservations</p>
        </div>

        {/* Réservations actives */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">En cours</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {activeReservations}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Actives</p>
        </div>

        {/* Paiements en attente */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-xs text-gray-500">À payer</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {paiementsEnAttente}
          </h3>
          <p className="text-sm text-gray-600 mt-1">En attente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Graphique revenus */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Revenus des 6 derniers mois
          </h2>
          <div className="space-y-4">
            {monthlyRevenue.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.revenue.toFixed(0)} MAD
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(item.revenue / maxRevenue) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top véhicules */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Top 5 véhicules
          </h2>
          {topVehicles.length === 0 ? (
            <div className="text-center py-8">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Aucune donnée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topVehicles.map((item, index) => (
                <div
                  key={item.vehicle.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {item.vehicle.marque} {item.vehicle.modele}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.count} location{item.count > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dernières réservations */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            Dernières réservations
          </h2>
          <Link
            href="/dashboard/reservations"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Voir tout →
          </Link>
        </div>

        {recentReservations.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Aucune réservation pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Véhicule
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Locataire
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Dates
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Prix
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentReservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900 text-sm">
                        {reservation.vehicleMarque} {reservation.vehicleModele}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-900">
                        {reservation.locataireNom}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-600">
                        {new Date(
                          reservation.dateDebut.toDate
                            ? reservation.dateDebut.toDate()
                            : reservation.dateDebut
                        ).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                        })}
                        {" - "}
                        {new Date(
                          reservation.dateFin.toDate
                            ? reservation.dateFin.toDate()
                            : reservation.dateFin
                        ).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-green-600 text-sm">
                        {reservation.prixTotal} MAD
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(reservation.status)}
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/dashboard/reservations/${reservation.id}`}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Voir →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
