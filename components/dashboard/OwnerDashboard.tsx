"use client";

import {
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import StatCard from "@/components/ui/StatCard";

export default function OwnerDashboard({ uid }: { uid: string }) {
  const [loading, setLoading] = useState(true);
  const [vehicules, setVehicules] = useState(0);
  const [reservations, setReservations] = useState(0);
  const [revenusMois, setRevenusMois] = useState(0);
  const [tauxOcc, setTauxOcc] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Compte véhicules du loueur
        const qVeh = query(
          collection(db, "vehicles"),
          where("userId", "==", uid)
        );
        const vehSnap = await getCountFromServer(qVeh);
        // Compte réservations liées à ce loueur
        const qRes = query(
          collection(db, "reservations"),
          where("loueurId", "==", uid)
        );
        const resSnap = await getCountFromServer(qRes);

        if (!active) return;
        setVehicules(vehSnap.data().count);
        setReservations(resSnap.data().count);

        // Placeholders pour la démo (à remplacer par un agrégat Firestore/Cloud Function)
        setRevenusMois(0);
        setTauxOcc(0);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [uid]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border bg-white animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Véhicules actifs" value={vehicules} />
        <StatCard label="Réservations" value={reservations} />
        <StatCard label="Revenus (mois)" value={`${revenusMois} MAD`} />
        <StatCard label="Taux d’occupation" value={`${tauxOcc}%`} />
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-2">Activité récente</h2>
        <p className="text-sm text-slate-500">
          Aucune réservation récente. Ajoutez vos véhicules pour commencer.
        </p>
      </section>
    </div>
  );
}
