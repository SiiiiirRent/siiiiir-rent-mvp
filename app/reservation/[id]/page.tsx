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
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Car,
  User,
  CreditCard,
  Check,
} from "lucide-react";

export default function ReservationPublicPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reservationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (reservationId) {
      loadReservation();
    }
  }, [reservationId]);

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
      setReservation({ id: reservationDoc.id, ...reservationDoc.data() });
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!reservation) return;

    try {
      setConfirming(true);

      await updateDoc(doc(db, "reservations", reservationId), {
        status: "confirmee",
        confirmedAt: serverTimestamp(),
        confirmedBy: user?.uid || "client_public",
      });

      setShowSuccess(true);
      await loadReservation();

      setTimeout(() => {
        if (user) {
          router.push("/espace-locataire");
        } else {
          setShowSuccess(false);
        }
      }, 3000);
    } catch (err) {
      console.error("Erreur confirmation:", err);
      alert("Erreur lors de la confirmation. Veuillez réessayer.");
    } finally {
      setConfirming(false);
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
            href="/"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Retour
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
      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-bold">Réservation confirmée !</p>
            <p className="text-sm text-green-100">Redirection en cours...</p>
          </div>
        </div>
      )}

      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-2xl font-bold inline-block">
                SIIIIIR <span className="text-green-600">RENT</span>
              </Link>
              <p className="text-sm text-gray-500">
                Réservation #{reservation.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!user && (
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                >
                  Se connecter
                </Link>
              )}
              {user && user.uid === reservation.locataireId && (
                <Link
                  href="/espace-locataire"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                >
                  Mes réservations
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* STATUS CARDS */}
        {reservation.status === "en_attente" && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    En attente de votre confirmation
                  </h2>
                  <p className="text-gray-600">
                    Confirmez cette réservation pour finaliser la location
                  </p>
                </div>
              </div>
              <button
                onClick={handleConfirmReservation}
                disabled={confirming}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {confirming ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Confirmation...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Confirmer la réservation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STATUS CONFIRMÉE */}
        {reservation.status === "confirmee" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Réservation confirmée ✅
                </h2>
                <p className="text-gray-600">
                  Votre réservation a été confirmée. Le loueur va vous
                  contacter.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STATUS EN COURS */}
        {reservation.status === "en_cours" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  En cours
                </h2>
                <p className="text-gray-600">La location est en cours</p>
              </div>
            </div>
          </div>
        )}

        {/* STATUS TERMINÉE */}
        {reservation.status === "terminee" && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Terminée
                </h2>
                <p className="text-gray-600">La location est terminée</p>
              </div>
            </div>
          </div>
        )}

        {/* STATUS ANNULÉE */}
        {reservation.status === "annulee" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Annulée
                </h2>
                <p className="text-gray-600">Cette réservation a été annulée</p>
              </div>
            </div>
          </div>
        )}

        {/* VEHICULE */}
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
            </div>
          </div>
        </div>

        {/* PERIODE */}
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

        {/* TARIF */}
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{reservation.loueurPhone}</p>

                    {/* FIX HERE → AJOUT DU <a> MANQUANT */}
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

        {/* CONTRAT */}
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
                <p className="text-gray-600 mb-4">Téléchargez votre contrat</p>

                {/* FIX HERE → AJOUT DU <a> MANQUANT */}
                <a
                  href={reservation.contract.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Télécharger PDF
                </a>
              </div>
            </div>
          </div>
        )}

        {/* CALL TO ACTION */}
        {!user && reservation.status === "confirmee" && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Créez votre compte pour suivre vos locations
            </h3>
            <p className="text-gray-600 mb-4">
              Accédez à toutes vos réservations en un seul endroit !
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Créer un compte
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 bg-white text-gray-700 border rounded-lg hover:bg-gray-50 font-medium"
              >
                Se connecter
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
