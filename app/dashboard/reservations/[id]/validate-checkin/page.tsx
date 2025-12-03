"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Reservation } from "@/lib/types";
import {
  getReservationForCheck,
  fastValidateCheckin,
  uploadCheckPDF,
} from "@/lib/checkinout";
import { generateCheckinPDF } from "@/lib/generateCheckInOutPDF";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SignaturePad from "@/components/checkinout/SignaturePad";
import Image from "next/image";

export default function ValidateCheckinPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [signature, setSignature] = useState<string>("");

  useEffect(() => {
    loadReservation();
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      setLoading(true);
      const res = await getReservationForCheck(reservationId);

      if (!res) {
        alert("❌ Réservation introuvable");
        return router.push("/dashboard/reservations");
      }

      if (user && res.loueurId !== user.uid) {
        alert("❌ Accès refusé");
        return router.push("/dashboard/reservations");
      }

      if (!res.checkin) {
        alert("❌ Check-in non effectué");
        return router.push(`/dashboard/reservations/${reservationId}`);
      }

      if (res.checkin.validatedAt) {
        alert("ℹ️ Check-in déjà validé");
        return router.push(`/dashboard/reservations/${reservationId}`);
      }

      setReservation(res);
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureSave = (base64: string) => {
    setSignature(base64);
    alert("Signature enregistrée");
  };

  const handleValidate = async () => {
    if (!signature) return alert("❌ Veuillez signer");
    if (!user) return alert("❌ Non connecté");
    if (!reservation) return alert("❌ Erreur");

    const confirmAction = confirm("Confirmer la validation du check-in ?");
    if (!confirmAction) return;

    try {
      setValidating(true);

      // 1. Préparer la réservation avec signature
      const reservationWithSignature: Reservation = {
        ...reservation,
        checkin: {
          ...reservation.checkin!,
          signatureLoueur: signature,
          validatedAt: new Date(),
          validatedBy: user.uid,
        },
      };

      // 2. Générer le PDF
      console.log("📄 Génération du PDF check-in...");
      const pdfBlob = await generateCheckinPDF(
        reservationWithSignature,
        user.displayName || user.email || "Loueur"
      );

      // 3. Upload le PDF
      console.log("☁️ Upload du PDF...");
      const pdfUrl = await uploadCheckPDF(reservationId, pdfBlob, "checkin");
      console.log("✅ PDF uploadé:", pdfUrl);

      // 4. Valider dans Firestore
      await fastValidateCheckin(reservationId, user.uid, signature);

      // 5. Mettre à jour avec le PDF URL
      const reservationRef = doc(db, "reservations", reservationId);
      await updateDoc(reservationRef, {
        "checkin.pdfUrl": pdfUrl,
        "checkin.pdfGeneratedAt": new Date(),
      });

      // 6. Envoyer l'email via le système centralisé
      try {
        console.log("📧 Envoi email check-in...");

        // Formater les dates
        const dateDebut = reservation.dateDebut?.toDate
          ? reservation.dateDebut.toDate()
          : new Date(reservation.dateDebut);
        const dateFin = reservation.dateFin?.toDate
          ? reservation.dateFin.toDate()
          : new Date(reservation.dateFin);

        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "checkin_validated",
            reservationId,
            pdfUrl,
            renterEmail: reservation.locataireEmail,
            renterName: reservation.locataireNom,
            vehicleName: `${reservation.vehicleMarque} ${reservation.vehicleModele}`,
            startDate: dateDebut.toLocaleDateString("fr-FR"),
            endDate: dateFin.toLocaleDateString("fr-FR"),
          }),
        });
        console.log("✅ Email check-in envoyé");
      } catch (emailError) {
        console.warn("⚠️ Erreur email (non bloquant):", emailError);
      }

      alert("✅ Check-in validé ! Le PDF et l'email ont été envoyés.");

      // 7. Redirection
      router.push(`/dashboard/reservations/${reservationId}`);
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert("❌ Erreur lors de la validation");
    } finally {
      setValidating(false);
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

  if (!reservation?.checkin) {
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
            🚗 Validation du check-in
          </h1>
          <p className="text-gray-600">
            Vérifiez l'état des lieux d'entrée avant de valider
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
            {reservation.checkin.photos.map((photo, i) => (
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
            📋 Informations de départ
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Kilométrage :</span>
              <span className="font-semibold">
                {reservation.checkin.kilometrage} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Carburant :</span>
              <span className="font-semibold">
                {reservation.checkin.carburant}
              </span>
            </div>
            {reservation.checkin.notes && (
              <div className="border-t pt-3">
                <p className="text-gray-600 text-sm mb-1">Remarques :</p>
                <p className="text-gray-900">{reservation.checkin.notes}</p>
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

        {/* Bouton de validation */}
        <button
          onClick={handleValidate}
          disabled={!signature || validating}
          className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {validating ? "⏳ Validation..." : "✅ Valider le check-in"}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Le PDF et l'email seront générés automatiquement après validation
        </p>
      </div>
    </div>
  );
}
