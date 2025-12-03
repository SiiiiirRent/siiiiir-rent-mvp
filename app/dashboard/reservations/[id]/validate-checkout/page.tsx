"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Reservation } from "@/lib/types";
import {
  getReservationForCheck,
  validateCheckout,
  declareCheckoutLitige,
  uploadCheckPDF,
} from "@/lib/checkinout";
import SignaturePad from "@/components/checkinout/SignaturePad";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { generateCheckoutPDF } from "@/lib/generateCheckInOutPDF";

export default function ValidateCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [signature, setSignature] = useState<string>("");

  const [showLitigeModal, setShowLitigeModal] = useState(false);
  const [litigeReason, setLitigeReason] = useState("");
  const [litigeMontant, setLitigeMontant] = useState<number>(0);
  const [declaringLitige, setDeclaringLitige] = useState(false);

  useEffect(() => {
    loadReservation();
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      setLoading(true);
      const res = await getReservationForCheck(reservationId);

      if (!res) {
        alert("❌ Réservation introuvable");
        router.push("/dashboard/reservations");
        return;
      }

      if (user && res.loueurId !== user.uid) {
        alert("❌ Accès refusé");
        router.push("/dashboard/reservations");
        return;
      }

      if (!res.checkin || !res.checkin.validatedAt) {
        alert("❌ Check-in non validé");
        router.push(`/dashboard/reservations/${reservationId}`);
        return;
      }

      if (!res.checkout) {
        alert("❌ Le check-out n'a pas été fait");
        router.push(`/dashboard/reservations/${reservationId}`);
        return;
      }

      if (res.checkout.validatedAt) {
        alert("ℹ️ Check-out déjà validé");
        router.push(`/dashboard/reservations/${reservationId}`);
        return;
      }

      setReservation(res);
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureSave = (signatureBase64: string) => {
    setSignature(signatureBase64);
    alert("Signature enregistrée");
  };

  const handleValidate = async () => {
    if (!signature) {
      alert("❌ Veuillez signer");
      return;
    }

    if (!user || !reservation) {
      alert("❌ Erreur utilisateur");
      return;
    }

    const confirmAction = confirm("Confirmer la validation du check-out ?");
    if (!confirmAction) return;

    try {
      setValidating(true);

      const reservationWithSignature: Reservation = {
        ...reservation,
        checkout: {
          ...reservation.checkout!,
          signatureLoueur: signature,
          validatedAt: new Date(),
          validatedBy: user.uid,
        },
      };

      // Générer le PDF
      const pdfBlob = await generateCheckoutPDF(
        reservationWithSignature,
        user.displayName || user.email || "Loueur"
      );

      // Upload le PDF
      const pdfUrl = await uploadCheckPDF(reservationId, pdfBlob, "checkout");

      // Valider dans Firestore
      await validateCheckout(reservationId, signature, user.uid, pdfUrl);

      // Envoyer l'email via le système centralisé
      try {
        console.log("📧 Envoi email check-out...");

        // Calculer la distance parcourue
        const distanceKm =
          reservation.checkout?.kilometrage && reservation.checkin?.kilometrage
            ? reservation.checkout.kilometrage - reservation.checkin.kilometrage
            : 0;

        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "checkout_validated",
            reservationId,
            pdfUrl,
            recipientEmail: reservation.locataireEmail,
            recipientName: reservation.locataireNom,
            vehicleName: `${reservation.vehicleMarque} ${reservation.vehicleModele}`,
            distanceKm,
            isOwner: false,
          }),
        });
        console.log("✅ Email check-out envoyé");
      } catch (emailError) {
        console.warn("⚠️ Erreur email (non bloquant):", emailError);
      }

      alert("✅ Check-out validé !");

      // Redirection
      router.push(`/dashboard/reservations/${reservationId}`);
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert("❌ Erreur lors de la validation");
    } finally {
      setValidating(false);
    }
  };

  const handleDeclareLitige = async () => {
    if (!litigeReason.trim()) {
      alert("❌ Décrivez le problème");
      return;
    }

    if (!signature) {
      alert("❌ Signature obligatoire");
      return;
    }

    if (!user || !reservation) {
      alert("❌ Erreur");
      return;
    }

    const confirmAction = confirm("Déclarer un litige ?");
    if (!confirmAction) return;

    try {
      setDeclaringLitige(true);

      // Déclarer le litige
      await declareCheckoutLitige(
        reservationId,
        { reason: litigeReason, montantReclame: litigeMontant },
        user.uid
      );

      const reservationWithLitige: Reservation = {
        ...reservation,
        checkout: {
          ...reservation.checkout!,
          litige: {
            declared: true,
            reason: litigeReason,
            montantReclame: litigeMontant,
            declaredAt: new Date(),
            declaredBy: user.uid,
          },
          signatureLoueur: signature,
          validatedAt: new Date(),
          validatedBy: user.uid,
        },
      };

      // Générer le PDF avec le litige
      const pdfBlob = await generateCheckoutPDF(
        reservationWithLitige,
        user.displayName || user.email || "Loueur"
      );

      // Upload le PDF
      const pdfUrl = await uploadCheckPDF(reservationId, pdfBlob, "checkout");

      // Valider dans Firestore
      await validateCheckout(reservationId, signature, user.uid, pdfUrl);

      // Envoyer l'email de litige via le système centralisé
      try {
        console.log("📧 Envoi email litige...");

        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "litige_declaree",
            reservationId,
            pdfUrl,
            renterEmail: reservation.locataireEmail,
            renterName: reservation.locataireNom,
            vehicleName: `${reservation.vehicleMarque} ${reservation.vehicleModele}`,
            litigeReason,
            litigeMontant,
          }),
        });
        console.log("✅ Email litige envoyé");
      } catch (emailError) {
        console.warn("⚠️ Erreur email (non bloquant):", emailError);
      }

      alert("⚠️ Litige déclaré et check-out validé");

      // Redirection
      router.push(`/dashboard/reservations/${reservationId}`);
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert("❌ Erreur lors de la déclaration");
    } finally {
      setDeclaringLitige(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!reservation?.checkout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-900">Données introuvables</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            🚗 Validation du check-out
          </h1>
          <p className="text-gray-600">
            Vérifiez l'état des lieux de sortie avant de valider
          </p>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Véhicule :</strong> {reservation.vehicleMarque}{" "}
              {reservation.vehicleModele}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Locataire :</strong> {reservation.locataireNom}
            </p>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📸 Photos du véhicule
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reservation.checkout.photos.map((photo, i) => (
              <div
                key={i}
                className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden border"
              >
                <Image
                  src={photo.url}
                  alt={photo.type}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                  {photo.type}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informations véhicule */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📋 Informations de retour
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Kilométrage :</span>
              <span className="font-semibold">
                {reservation.checkout.kilometrage} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Carburant :</span>
              <span className="font-semibold">
                {reservation.checkout.carburant}
              </span>
            </div>
            {reservation.checkin?.kilometrage && (
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-600">Distance parcourue :</span>
                <span className="font-semibold text-green-600">
                  {reservation.checkout.kilometrage -
                    reservation.checkin.kilometrage}{" "}
                  km
                </span>
              </div>
            )}
            {reservation.checkout.notes && (
              <div className="border-t pt-3">
                <p className="text-gray-600 text-sm mb-1">Remarques :</p>
                <p className="text-gray-900">{reservation.checkout.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Signature */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <SignaturePad
            onSave={handleSignatureSave}
            label="Votre signature (loueur)"
          />
        </div>

        {/* Boutons d'action */}
        <div className="space-y-4">
          <button
            onClick={handleValidate}
            disabled={!signature || validating}
            className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validating ? "⏳ Validation..." : "✅ Valider le check-out"}
          </button>

          <button
            onClick={() => setShowLitigeModal(true)}
            disabled={!signature || declaringLitige}
            className="w-full bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            Déclarer un litige
          </button>
        </div>
      </div>

      {/* Modal Litige */}
      {showLitigeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ⚠️ Déclarer un litige
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description du problème *
                </label>
                <textarea
                  value={litigeReason}
                  onChange={(e) => setLitigeReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Décrivez le problème constaté..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant réclamé (optionnel)
                </label>
                <input
                  type="number"
                  value={litigeMontant}
                  onChange={(e) => setLitigeMontant(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowLitigeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeclareLitige}
                  disabled={!litigeReason.trim() || declaringLitige}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {declaringLitige ? "Envoi..." : "Confirmer le litige"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
