"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Car,
  User,
  CreditCard,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import RequireLocataire from "@/components/auth/RequireLocataire";
import SignaturePad from "@/components/SignaturePad";

function ReservationDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reservationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (reservationId && user) {
      loadReservation();
    }
  }, [reservationId, user]);

  const loadReservation = async () => {
    try {
      setLoading(true);
      setError(null);

      const reservationDoc = await getDoc(
        doc(db, "reservations", reservationId)
      );

      if (!reservationDoc.exists()) {
        setError("Réservation introuvable");
        return;
      }

      const data = { id: reservationDoc.id, ...reservationDoc.data() };

      const reservationData = data as any;
      if (reservationData.locataireId !== user?.uid) {
        setError("Vous n'avez pas accès à cette réservation");
        return;
      }

      setReservation(data);
    } catch (err) {
      console.error("Erreur chargement réservation:", err);
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // 🔥🔥🔥 MODIFICATION COMPLETE DE LA FONCTION 🔥🔥🔥
  // ----------------------------------------------------------------
  const handleRenterSignatureChange = async (newSignature: string | null) => {
    try {
      const reservationRef = doc(db, "reservations", reservationId);

      // 1️⃣ Save in Firestore
      await updateDoc(reservationRef, {
        renterSignature: newSignature,
        renterSignedAt: newSignature ? serverTimestamp() : null,
        ...(newSignature && {
          "contract.signedByRenter": true,
          "contract.renterSignatureBase64": newSignature,
        }),
        updatedAt: serverTimestamp(),
      });

      // 2️⃣ Regenerate contract PDF
      if (newSignature) {
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

            setReservation((prev: any) => ({
              ...prev,
              renterSignature: newSignature,
              contract: {
                ...prev.contract,
                url: data.contractUrl,
                signedByRenter: true,
                renterSignatureBase64: newSignature,
              },
            }));
          }
        } catch (pdfError) {
          console.warn("⚠️ PDF non régénéré:", pdfError);
        }
      } else {
        setReservation((prev: any) => ({
          ...prev,
          renterSignature: null,
          contract: {
            ...prev.contract,
            signedByRenter: false,
            renterSignatureBase64: null,
          },
        }));
      }

      // 3️⃣ Confirmation + redirect
      alert("✅ Votre contrat a bien été signé !");
      router.push("/espace-locataire/reservations");
    } catch (error) {
      console.error("❌ Erreur mise à jour signature:", error);
      alert("Erreur lors de la mise à jour de la signature");
    }
  };
  // ----------------------------------------------------------------

  const handleCancelReservation = async () => {
    const confirmCancel = window.confirm(
      "Voulez-vous vraiment annuler cette réservation ?"
    );
    if (!confirmCancel) return;

    try {
      setCancelling(true);
      const reservationRef = doc(db, "reservations", reservationId);

      await updateDoc(reservationRef, {
        status: "annulee",
        cancelledBy: "locataire",
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      try {
        await fetch("/api/reservations/cancel/by-renter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId }),
        });
      } catch (emailError) {
        console.warn("⚠️ Email non envoyé:", emailError);
      }

      setReservation((prev: any) => ({ ...prev, status: "annulee" }));
      alert("Votre réservation a été annulée.");
    } catch (error) {
      console.error("❌ Erreur annulation:", error);
      alert("Erreur lors de l'annulation");
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (raw: any): string => {
    if (!raw) return "-";
    const d = raw?.toDate ? raw.toDate() : new Date(raw);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (raw: any): string => {
    if (!raw) return "-";
    const d = raw?.toDate ? raw.toDate() : new Date(raw);
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Réservation introuvable
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/espace-locataire"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à mes réservations
          </Link>
        </div>
      </div>
    );
  }

  const dateDebut = reservation.dateDebut || reservation.startDate;
  const dateFin = reservation.dateFin || reservation.endDate;
  const vehicleName =
    `${reservation.vehicleMarque || ""} ${reservation.vehicleModele || ""}`.trim() ||
    "Véhicule";
  const prixTotal = reservation.prixTotal || reservation.totalPrice || 0;

  let nbJours = reservation.nbJours || 1;
  if (!reservation.nbJours && dateDebut && dateFin) {
    const start = dateDebut?.toDate ? dateDebut.toDate() : new Date(dateDebut);
    const end = dateFin?.toDate ? dateFin.toDate() : new Date(dateFin);
    const diff = end.getTime() - start.getTime();
    nbJours = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/espace-locataire" className="text-2xl font-bold">
              SIIIIIR <span className="text-green-600">RENT</span>
            </Link>
            <Link
              href="/espace-locataire"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Mes réservations</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* CONTENU */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* STATUTS */}
        {reservation.status === "en_attente" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  En attente de confirmation
                </h2>
                <p className="text-gray-600">
                  Le loueur doit confirmer votre réservation
                </p>
              </div>
            </div>
          </div>
        )}

        {reservation.status === "confirmee" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Réservation confirmée
                </h2>
                <p className="text-gray-600">
                  Le loueur vous contactera prochainement.
                </p>
              </div>
            </div>
          </div>
        )}

        {reservation.status === "en_cours" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Location en cours
                </h2>
                <p className="text-gray-600">
                  Profitez bien de votre véhicule !
                </p>
              </div>
            </div>
          </div>
        )}

        {reservation.status === "terminee" && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Location terminée
                </h2>
                <p className="text-gray-600">
                  Merci d'avoir loué avec SIIIIIR RENT.
                </p>
              </div>
            </div>
          </div>
        )}

        {reservation.status === "annulee" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Réservation annulée
                </h2>
                <p className="text-gray-600">
                  Cette réservation a été annulée.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VÉHICULE */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5" />
            Véhicule loué
          </h3>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden">
              {reservation.vehiclePhoto ? (
                <img
                  src={reservation.vehiclePhoto}
                  alt={vehicleName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-4xl">
                  🚗
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <h4 className="text-2xl font-bold text-gray-900">
                {vehicleName}
              </h4>
              {reservation.vehicleImmatriculation && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span className="font-mono">
                    {reservation.vehicleImmatriculation}
                  </span>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Réservation #{reservation.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>

        {/* PÉRIODE */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Période de location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Départ</p>
              <p className="font-semibold text-gray-900">
                {formatDate(dateDebut)}
              </p>
              <p className="text-sm text-gray-600">{formatTime(dateDebut)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Retour</p>
              <p className="font-semibold text-gray-900">
                {formatDate(dateFin)}
              </p>
              <p className="text-sm text-gray-600">{formatTime(dateFin)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Durée</p>
              <p className="text-3xl font-bold text-green-600">
                {nbJours}
                <span className="text-lg text-gray-600 ml-1">
                  jour{nbJours > 1 ? "s" : ""}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* TARIFICATION */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Tarification
          </h3>
          <div className="space-y-3">
            {reservation.prixParJour && (
              <div className="flex justify-between">
                <span className="text-gray-600">Prix par jour</span>
                <span className="font-semibold">
                  {reservation.prixParJour} MAD
                </span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-bold">Prix total</span>
                <span className="text-3xl font-bold text-green-600">
                  {prixTotal} MAD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LOUEUR */}
        {(reservation.loueurNom || reservation.loueurPhone) && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Votre loueur
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reservation.loueurNom && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nom</p>
                  <p className="font-semibold">{reservation.loueurNom}</p>
                </div>
              )}

              {reservation.loueurPhone && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                  <div className="flex items-center gap-3">
                    <a
                      href={`tel:${reservation.loueurPhone}`}
                      className="flex items-center gap-2 text-gray-900 hover:text-green-600"
                    >
                      <Phone className="w-4 h-4" />
                      {reservation.loueurPhone}
                    </a>

                    <a
                      href={`https://wa.me/${reservation.loueurPhone.replace(/\s/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 text-sm font-medium hover:underline"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SIGNATURE */}
        {reservation.status !== "annulee" && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Votre signature
            </h3>
            <SignaturePad
              signerName={
                reservation.locataireNom ||
                reservation.renterName ||
                user?.displayName ||
                "Locataire"
              }
              signature={reservation.renterSignature || null}
              onSignatureChange={handleRenterSignatureChange}
            />
          </div>
        )}

        {/* CONTRAT PDF */}
        {reservation.contract?.url && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Votre contrat de location
                </h3>
                <p className="text-gray-600 mb-4">
                  Téléchargez et conservez votre contrat
                </p>

                <a
                  href={reservation.contract.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Télécharger le PDF
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ANNULATION */}
        {reservation.status === "confirmee" && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Annuler la réservation
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Vous pouvez annuler votre réservation. Le loueur sera notifié.
            </p>
            <button
              onClick={handleCancelReservation}
              disabled={cancelling}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {cancelling ? "Annulation..." : "Annuler cette réservation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReservationDetailPage() {
  return (
    <RequireLocataire>
      <ReservationDetailContent />
    </RequireLocataire>
  );
}
