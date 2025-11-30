// 🔥🔥🔥 VERSION CORRIGÉE — AVEC REDIRECTION LOCATAIRE 🔥🔥🔥

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Reservation } from "@/lib/types";
import {
  getReservationForCheck,
  validateCheckout,
  declareCheckoutLitige,
} from "@/lib/checkinout";
import SignaturePad from "@/components/checkinout/SignaturePad";
import ComparisonViewer from "@/components/checkinout/ComparisonViewer";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { generateCheckoutPDF } from "@/lib/generateCheckInOutPDF";
import { uploadCheckPDF } from "@/lib/checkinout";

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

      const pdfBlob = await generateCheckoutPDF(
        reservationWithSignature,
        user.displayName || user.email || "Loueur"
      );

      const pdfUrl = await uploadCheckPDF(reservationId, pdfBlob, "checkout");

      await validateCheckout(reservationId, signature, user.uid, pdfUrl);

      alert("✅ Check-out validé !");

      // 🌟 REDIRECTION LOCATAIRE
      router.push(`/locataire/reservations`);
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

      const pdfBlob = await generateCheckoutPDF(
        reservationWithLitige,
        user.displayName || user.email || "Loueur"
      );

      const pdfUrl = await uploadCheckPDF(reservationId, pdfBlob, "checkout");

      await validateCheckout(reservationId, signature, user.uid, pdfUrl);

      alert("⚠️ Litige déclaré et check-out validé");

      // 🌟 REDIRECTION LOCATAIRE
      router.push(`/locataire/reservations`);
    } finally {
      setDeclaringLitige(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">{/* … UI inchangée … */}</div>
  );
}
