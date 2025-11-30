"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Reservation } from "@/lib/types";
import { getReservationForCheck, fastValidateCheckin } from "@/lib/checkinout";
import SignaturePad from "@/components/checkinout/SignaturePad";
import Image from "next/image";

export default function ValidateCheckinPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState<string>("");

  useEffect(() => {
    loadReservation();
  }, [reservationId]);

  const loadReservation = async () => {
    try {
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

    // 1. Validation rapide
    await fastValidateCheckin(reservationId, user.uid, signature);

    // 2. Traitement en arrière-plan (PDF + email)
    await fetch("/api/checkin/after-validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId,
        loueurName: user.displayName || user.email,
      }),
    });

    alert("✅ Validation effectuée ! Le PDF sera généré automatiquement.");

    // 3. REDIRECTION — VERSION LOCATAIRE
    router.push(`/dashboard/reservations/${reservationId}`);
  };

  if (loading) return <p>Chargement...</p>;
  if (!reservation?.checkin) return <p>Données introuvables</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Validation du check-in</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {reservation.checkin.photos.map((photo, i) => (
          <div
            key={i}
            className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden"
          >
            <Image
              src={photo.url}
              alt={photo.type}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <SignaturePad
        onSave={handleSignatureSave}
        label="Votre signature (loueur)"
      />

      <button
        onClick={handleValidate}
        disabled={!signature}
        className="w-full mt-6 bg-green-600 text-white p-4 rounded-lg font-bold"
      >
        Valider le check-in
      </button>
    </div>
  );
}
