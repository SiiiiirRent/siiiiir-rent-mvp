"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
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
import Link from "next/link";
import { Calendar, Car, Clock, LogOut, User, Filter } from "lucide-react";
import RequireLocataire from "@/components/auth/RequireLocataire";
import SignaturePad from "@/components/SignaturePad";

// ✅ COMPOSANT BADGE KYC
function KycBadge({ userId }: { userId?: string }) {
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadKycStatus = async () => {
      try {
        const userDoc = await getDocs(
          query(collection(db, "users"), where("uid", "==", userId))
        );

        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
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
      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
        <span>✅ KYC Vérifié</span>
      </div>
    );
  }

  if (kycStatus === "rejected") {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
        <span>❌ KYC Refusé</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
      <span>⏳ KYC En attente</span>
    </div>
  );
}
// ✅ TYPES POUR LES FILTRES
type FilterStatus =
  | "all"
  | "en_attente"
  | "confirmee"
  | "en_cours"
  | "terminee"
  | "annulee";

function EspaceLocataireContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

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
      const reservationsQuery = query(
        collection(db, "reservations"),
        where("locataireId", "==", user.uid)
      );
      const snapshot = await getDocs(reservationsQuery);
      const reservationsData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Reservation[];

      const sorted = reservationsData.sort((a, b) => {
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
      console.error("Erreur chargement réservations:", error);
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

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

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

  // ✅ FONCTION CORRIGÉE - Régénère le PDF quand le locataire signe
  const handleRenterSignatureChange = async (
    reservationId: string,
    newSignature: string | null
  ) => {
    try {
      const reservationRef = doc(db, "reservations", reservationId);

      // 1) Update Firestore avec la nouvelle signature
      await updateDoc(reservationRef, {
        renterSignature: newSignature,
        renterSignedAt: newSignature ? serverTimestamp() : null,
        ...(newSignature && {
          "contract.signedByRenter": true,
          "contract.renterSignatureBase64": newSignature,
        }),
        updatedAt: serverTimestamp(),
      });

      // 2) Si signature ajoutée, régénérer le PDF
      if (newSignature) {
        console.log("📄 Régénération du PDF avec signature locataire...");

        try {
          const response = await fetch("/api/contracts/regenerate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reservationId,
              renterSignatureBase64: newSignature,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log("✅ PDF régénéré avec succès:", data.contractUrl);

            // 3) Update UI local avec la nouvelle URL du contrat
            setReservations((prev) =>
              prev.map((r) =>
                r.id === reservationId
                  ? {
                      ...(r as any),
                      renterSignature: newSignature,
                      contract: {
                        ...(r as any).contract,
                        url: data.contractUrl,
                        signedByRenter: true,
                        renterSignatureBase64: newSignature,
                      },
                    }
                  : r
              )
            );
          } else {
            console.warn("⚠️ Erreur régénération PDF (non bloquant)");
          }
        } catch (pdfError) {
          console.warn("⚠️ PDF non régénéré (non bloquant):", pdfError);
        }
      } else {
        // Si suppression de signature, juste update UI local
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? {
                  ...(r as any),
                  renterSignature: null,
                  contract: {
                    ...(r as any).contract,
                    signedByRenter: false,
                    renterSignatureBase64: null,
                  },
                }
              : r
          )
        );
      }

      console.log("✅ Signature locataire mise à jour pour", reservationId);
    } catch (error) {
      console.error("❌ Erreur mise à jour signature locataire:", error);
    }
  };

  // ✅ FONCTION CORRIGÉE - Annulation depuis le client
  const handleCancelReservation = async (reservation: Reservation) => {
    const confirmCancel = window.confirm(
      "Voulez-vous vraiment annuler cette réservation ?"
    );
    if (!confirmCancel) return;

    try {
      // 1) Update direct dans Firestore (depuis client authentifié)
      const reservationRef = doc(db, "reservations", reservation.id);

      await updateDoc(reservationRef, {
        status: "annulee",
        cancelledBy: "locataire",
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Statut mis à jour dans Firestore");

      // 2) Envoyer email via API (sans toucher à Firestore)
      try {
        await fetch("/api/reservations/cancel/by-renter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservationId: reservation.id,
          }),
        });
        console.log("✅ Email envoyé au loueur");
      } catch (emailError) {
        console.warn("⚠️ Email non envoyé (pas bloquant):", emailError);
      }

      // 3) Update UI local
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id ? { ...(r as any), status: "annulee" } : r
        )
      );

      console.log("✅ Réservation annulée avec succès");
      alert(
        "Votre réservation a été annulée. Un email a été envoyé au loueur."
      );
    } catch (error) {
      console.error("❌ Erreur annulation réservation:", error);
      alert("Erreur lors de l'annulation de la réservation.");
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR - MODIFIÉE AVEC KYC */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold">
                SIIIIIR <span className="text-green-600">RENT</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs text-gray-500">Locataire</p>
              </div>

              {/* ✅ NOUVEAU : Badge KYC */}
              <KycBadge userId={user?.uid} />

              {/* ✅ Lien vers profil */}
              <Link
                href="/espace-locataire/profil"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Mon profil</span>
              </Link>

              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                  {user?.displayName?.[0] || user?.email?.[0] || "L"}
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENU */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mes réservations
          </h1>
          <p className="text-gray-600">
            Bienvenue {user?.displayName || user?.email} 👋
          </p>
        </div>

        <div className="mb-6">
          <Link
            href="/vehicules"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
          >
            <Car className="w-5 h-5" />
            Découvrir plus de véhicules
          </Link>
        </div>

        {/* ✅ NOUVEAUX FILTRES PAR STATUT */}
        {!loading && reservations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">
                Filtrer par statut
              </h3>
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
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune réservation
            </h3>
            <p className="text-gray-600 mb-6">
              Vous n&apos;avez pas encore de réservation
            </p>
            <Link
              href="/vehicules"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Découvrir les véhicules
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
              const anyReservation = reservation as any;
              const contractUrl = anyReservation.contract?.url;

              const nbJours = computeNbJours(reservation);
              const prixTotal = getPrixTotal(reservation);

              const dateDebutRaw =
                anyReservation.dateDebut || anyReservation.startDate;
              const dateFinRaw =
                anyReservation.dateFin || anyReservation.endDate;

              const vehicleLabel =
                reservation.vehicleMarque || reservation.vehicleModele
                  ? `${reservation.vehicleMarque} ${reservation.vehicleModele}`
                  : anyReservation.vehicleName || "Véhicule";

              return (
                <div
                  key={reservation.id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-6">
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

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {vehicleLabel}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Réservation #{reservation.id.slice(0, 8)}
                          </p>
                        </div>
                        {getStatusBadge(reservation.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">
                            Date de début
                          </p>
                          <p className="font-medium text-gray-900">
                            {formatDate(dateDebutRaw)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-600 mb-1">
                            Date de fin
                          </p>
                          <p className="font-medium text-gray-900">
                            {formatDate(dateFinRaw)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-600 mb-1">Durée</p>
                          <p className="font-medium text-gray-900">
                            {nbJours} jour{nbJours > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <p className="text-sm text-gray-600">Prix total</p>
                          <p className="text-2xl font-bold text-green-600">
                            {prixTotal} MAD
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          {reservation.status === "en_attente" && (
                            <p className="text-xs text-gray-600">
                              <Clock className="w-3 h-3 inline mr-1" />
                              En attente
                            </p>
                          )}

                          <Link
                            href={`/espace-locataire/reservations/${reservation.id}`}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                          >
                            Voir les détails
                          </Link>
                        </div>
                      </div>

                      {reservation.status === "confirmee" && (
                        <button
                          onClick={() => handleCancelReservation(reservation)}
                          className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Annuler la réservation
                        </button>
                      )}

                      {reservation.status !== "annulee" && (
                        <div className="mt-6 pt-4 border-t">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Signature du locataire
                          </h4>

                          <SignaturePad
                            signerName={
                              anyReservation.locataireNom ||
                              anyReservation.renterName ||
                              user?.displayName ||
                              "Locataire"
                            }
                            signature={anyReservation.renterSignature || null}
                            onSignatureChange={(newSignature) =>
                              handleRenterSignatureChange(
                                reservation.id,
                                newSignature
                              )
                            }
                          />

                          {contractUrl && (
                            <a
                              href={contractUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-4 text-green-600 underline text-sm"
                            >
                              📄 Voir le contrat PDF
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EspaceLocatairePage() {
  return (
    <RequireLocataire>
      <EspaceLocataireContent />
    </RequireLocataire>
  );
}
