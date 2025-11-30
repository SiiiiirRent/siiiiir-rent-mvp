"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Reservation } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Calendar, Car, Clock, Phone, Mail, Eye, Filter } from "lucide-react";

// 🔥 On utilise tes fonctions de lib/reservations
import { confirmReservationFullFlow } from "@/lib/reservations";

// ✅ WHATSAPP - IMPORTS
import ShareWhatsAppButton from "@/components/whatsapp/ShareWhatsAppButton";
import {
  generateReservationMessage,
  generateWhatsAppLink,
  getReservationUrl,
} from "@/lib/whatsapp";

// ✅ TYPES POUR LES FILTRES
type FilterStatus =
  | "all"
  | "en_attente"
  | "confirmee"
  | "en_cours"
  | "terminee"
  | "annulee";

function DashboardReservationsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // ✅ NOUVEAU : État du filtre
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  useEffect(() => {
    if (user) {
      loadReservations();
    }
  }, [user]);

  const loadReservations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const reservationsQuery = query(
        collection(db, "reservations"),
        where("loueurId", "==", user.uid)
      );

      const snapshot = await getDocs(reservationsQuery);
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Reservation[];

      const sorted = data.sort((a, b) => {
        const createdA: any = (a as any).createdAt;
        const createdB: any = (b as any).createdAt;

        const dateA =
          createdA?.toDate && typeof createdA.toDate === "function"
            ? createdA.toDate()
            : createdA
              ? new Date(createdA)
              : new Date(0);

        const dateB =
          createdB?.toDate && typeof createdB.toDate === "function"
            ? createdB.toDate()
            : createdB
              ? new Date(createdB)
              : new Date(0);

        return dateB.getTime() - dateA.getTime();
      });

      setReservations(sorted);
    } catch (error) {
      console.error("❌ Erreur chargement réservations loueur:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVEAU : Filtrer les réservations
  const filteredReservations = reservations.filter((reservation) => {
    if (filterStatus === "all") return true;
    return reservation.status === filterStatus;
  });

  // ✅ NOUVEAU : Compter par statut
  const countByStatus = {
    all: reservations.length,
    en_attente: reservations.filter((r) => r.status === "en_attente").length,
    confirmee: reservations.filter((r) => r.status === "confirmee").length,
    en_cours: reservations.filter((r) => r.status === "en_cours").length,
    terminee: reservations.filter((r) => r.status === "terminee").length,
    annulee: reservations.filter((r) => r.status === "annulee").length,
  };

  // ---------- Helpers UI ----------

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      en_attente: "bg-yellow-100 text-yellow-800",
      confirmee: "bg-blue-100 text-blue-800",
      en_cours: "bg-green-100 text-green-800",
      terminee: "bg-gray-100 text-gray-800",
      annulee: "bg-red-100 text-red-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const labels: Record<string, string> = {
      en_attente: "En attente",
      confirmee: "Confirmée",
      en_cours: "En cours",
      terminee: "Terminée",
      annulee: "Annulée",
      cancelled: "Annulée",
    };

    const css = styles[status] || "bg-gray-100 text-gray-800";
    const label = labels[status] || status;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${css}`}>
        {label}
      </span>
    );
  };

  const formatDate = (raw: any): string => {
    if (!raw) return "-";

    const d =
      raw?.toDate && typeof raw.toDate === "function"
        ? raw.toDate()
        : new Date(raw);

    if (isNaN(d.getTime())) return "-";

    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const computeNbJours = (reservation: Reservation): number => {
    if (reservation.nbJours && reservation.nbJours > 0) {
      return reservation.nbJours;
    }

    const anyRes = reservation as any;
    const startRaw = anyRes.dateDebut || anyRes.startDate;
    const endRaw = anyRes.dateFin || anyRes.endDate;

    const start =
      startRaw?.toDate && typeof startRaw.toDate === "function"
        ? startRaw.toDate()
        : startRaw
          ? new Date(startRaw)
          : null;

    const end =
      endRaw?.toDate && typeof endRaw.toDate === "function"
        ? endRaw.toDate()
        : endRaw
          ? new Date(endRaw)
          : null;

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 1;
    }

    const diff = end.getTime() - start.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 1;
  };

  const getPrixTotal = (reservation: Reservation): number => {
    return reservation.prixTotal ?? reservation.totalPrice ?? 0;
  };

  // ---------- Actions : CONFIRMER + CONTRAT + REDIRECTION ----------

  const handleConfirmReservation = async (reservation: Reservation) => {
    const confirmAction = window.confirm(
      "Confirmer cette réservation, générer le contrat et passer à la signature ?"
    );
    if (!confirmAction) return;

    try {
      setActionLoadingId(reservation.id);

      // 🔥 Appel de la fonction full flow (statut + contrat + Storage + Firestore)
      const result = await confirmReservationFullFlow(reservation.id);

      // Mise à jour locale immédiate
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id
            ? {
                ...r,
                status: "confirmee",
                contractGenerated: true,
                contractUrl: result.contractUrl,
              }
            : r
        )
      );

      // Redirection vers la page de signature loueur
      router.push(result.nextStep);
    } catch (error) {
      console.error("❌ ERREUR CONFIRMATION FULL FLOW :", error);
      alert("Erreur lors de la confirmation de la réservation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ---------- Action : ANNULER PAR LE LOUEUR ----------

  const handleCancelByOwner = async (reservation: Reservation) => {
    const confirmCancel = window.confirm(
      "Voulez-vous vraiment annuler cette réservation ?"
    );
    if (!confirmCancel) return;

    try {
      setActionLoadingId(reservation.id);

      // 1) Update Firestore directement depuis le client authentifié
      const reservationRef = doc(db, "reservations", reservation.id);

      await updateDoc(reservationRef, {
        status: "annulee",
        cancelledBy: "proprietaire",
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Statut mis à jour dans Firestore");

      // 2) Envoyer email via API (non bloquant)
      try {
        await fetch("/api/reservations/cancel/by-owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservationId: reservation.id,
          }),
        });
        console.log("✅ Email envoyé au locataire");
      } catch (emailError) {
        console.warn("⚠️ Email non envoyé (pas bloquant):", emailError);
      }

      // 3) Update UI local
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id ? { ...r, status: "annulee" } : r
        )
      );

      console.log("✅ Réservation annulée avec succès");
      alert("Réservation annulée. Un email a été envoyé au locataire.");
    } catch (error) {
      console.error("❌ ERREUR ANNULATION LOUEUR :", error);
      alert("Erreur lors de l'annulation de la réservation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // ---------- Protection auth ----------

  if (!user) {
    router.push("/login");
    return null;
  }

  // ---------- RENDER ----------

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Réservations
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez les réservations de vos véhicules en temps réel.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Retour au dashboard
        </Link>
      </div>

      {/* ✅ NOUVEAUX FILTRES PAR STATUT */}
      {!loading && reservations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtrer par statut</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Toutes ({countByStatus.all})
            </button>

            <button
              onClick={() => setFilterStatus("en_attente")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "en_attente"
                  ? "bg-yellow-600 text-white"
                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
              }`}
            >
              En attente ({countByStatus.en_attente})
            </button>

            <button
              onClick={() => setFilterStatus("confirmee")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "confirmee"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
              }`}
            >
              Confirmées ({countByStatus.confirmee})
            </button>

            <button
              onClick={() => setFilterStatus("en_cours")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "en_cours"
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-800 hover:bg-green-200"
              }`}
            >
              En cours ({countByStatus.en_cours})
            </button>

            <button
              onClick={() => setFilterStatus("terminee")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "terminee"
                  ? "bg-gray-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              Terminées ({countByStatus.terminee})
            </button>

            <button
              onClick={() => setFilterStatus("annulee")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "annulee"
                  ? "bg-red-600 text-white"
                  : "bg-red-100 text-red-800 hover:bg-red-200"
              }`}
            >
              Annulées ({countByStatus.annulee})
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des réservations...</p>
          </div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-10 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Aucune réservation pour le moment
          </h2>
          <p className="text-gray-600 mb-4">
            Dès qu&apos;un client réservera un véhicule, vous verrez sa demande
            ici.
          </p>
          <Link
            href="/dashboard/mes-vehicules"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            <Car className="w-4 h-4 mr-2" />
            Voir mes véhicules
          </Link>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-10 text-center">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Aucune réservation {filterStatus !== "all" && `"${filterStatus}"`}
          </h2>
          <p className="text-gray-600 mb-4">
            Essayez un autre filtre pour voir vos réservations.
          </p>
          <button
            onClick={() => setFilterStatus("all")}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Voir toutes les réservations
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredReservations.map((reservation) => {
            const anyRes = reservation as any;

            const nbJours = computeNbJours(reservation);
            const prixTotal = getPrixTotal(reservation);

            const dateDebutRaw = anyRes.dateDebut || anyRes.startDate;
            const dateFinRaw = anyRes.dateFin || anyRes.endDate;

            const vehicleLabel =
              reservation.vehicleMarque || reservation.vehicleModele
                ? `${reservation.vehicleMarque} ${reservation.vehicleModele}`
                : anyRes.vehicleName || "Véhicule";

            const locataireNom =
              reservation.locataireNom ||
              anyRes.renterName ||
              "Locataire (non spécifié)";

            const locataireEmail =
              reservation.locataireEmail || anyRes.renterEmail || "-";

            const locatairePhone =
              reservation.locatairePhone || anyRes.renterPhone || "-";

            // ✅ WHATSAPP - Génération du lien pour chaque réservation
            const reservationUrl = getReservationUrl(reservation.id);
            const whatsappMessage = generateReservationMessage({
              vehicleName: vehicleLabel,
              startDate: formatDate(dateDebutRaw),
              endDate: formatDate(dateFinRaw),
              prixTotal,
              reservationUrl,
              contratPdfUrl: reservation.contract?.url || null,
              renterName: locataireNom,
            });
            const phoneNumber =
              locatairePhone !== "-" ? locatairePhone : undefined;
            const whatsappUrl = generateWhatsAppLink(
              whatsappMessage,
              phoneNumber
            );

            return (
              <div
                key={reservation.id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image véhicule */}
                  <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {reservation.vehiclePhoto ? (
                      <img
                        src={reservation.vehiclePhoto}
                        alt={vehicleLabel}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-4xl">
                        🚗
                      </div>
                    )}
                  </div>

                  {/* Infos principales */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">
                          {vehicleLabel}
                        </h2>
                        <p className="text-xs text-gray-500">
                          ID réservation #{reservation.id.slice(0, 8)}
                        </p>
                      </div>
                      {getStatusBadge(reservation.status)}
                    </div>

                    {/* Dates & durée */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Date de début
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatDate(dateDebutRaw)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Date de fin
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatDate(dateFinRaw)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Durée</p>
                        <p className="font-medium text-gray-900">
                          {nbJours} jour{nbJours > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Locataire */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Nom du locataire
                        </p>
                        <p className="font-medium text-gray-900">
                          {locataireNom}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Email
                        </p>
                        <p className="text-sm text-gray-800 break-all">
                          {locataireEmail}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Téléphone
                        </p>
                        <p className="text-sm text-gray-800">
                          {locatairePhone}
                        </p>
                      </div>
                    </div>

                    {/* Prix & actions */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Prix total</p>
                        <p className="text-2xl font-bold text-green-600">
                          {prixTotal} MAD
                        </p>
                        {reservation.status === "en_attente" && (
                          <p className="text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            En attente de votre confirmation
                          </p>
                        )}
                      </div>

                      {/* ✅ BOUTONS D'ACTION */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* ✅ WHATSAPP - Bouton partage réservation */}
                        {reservation.status !== "annulee" &&
                          reservation.status !== "terminee" && (
                            <ShareWhatsAppButton
                              whatsappUrl={whatsappUrl}
                              variant="small"
                              label="Envoyer au client"
                            />
                          )}

                        {/* ✅ BOUTON VOIR DÉTAILS - TOUJOURS VISIBLE */}
                        <Link
                          href={`/dashboard/reservations/${reservation.id}`}
                          className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </Link>

                        {/* BOUTON CONFIRMER - Si en attente */}
                        {reservation.status === "en_attente" && (
                          <button
                            onClick={() =>
                              handleConfirmReservation(reservation)
                            }
                            disabled={actionLoadingId === reservation.id}
                            className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {actionLoadingId === reservation.id
                              ? "Traitement..."
                              : "Confirmer"}
                          </button>
                        )}

                        {/* BOUTON ANNULER - Si pas annulée ou terminée */}
                        {reservation.status !== "annulee" &&
                          reservation.status !== "terminee" && (
                            <button
                              onClick={() => handleCancelByOwner(reservation)}
                              disabled={actionLoadingId === reservation.id}
                              className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                            >
                              {actionLoadingId === reservation.id
                                ? "Annulation..."
                                : "Annuler"}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardReservationsPage() {
  // Le layout /dashboard est déjà protégé par RequireAuth
  return <DashboardReservationsContent />;
}
