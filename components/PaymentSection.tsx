"use client";

import { Reservation } from "@/lib/types";

interface PaymentSectionProps {
  reservation: Reservation;
  onUpdate: () => void;
}

export default function PaymentSection({
  reservation,
  onUpdate,
}: PaymentSectionProps) {
  return (
    <div className="bg-red-500 text-white p-8 rounded-xl">
      <h1 className="text-2xl font-bold">🔥 PAIEMENT SECTION 🔥</h1>
      <p>Réservation: {reservation.id}</p>
      <p>Prix: {reservation.prixTotal} MAD</p>
    </div>
  );
}
