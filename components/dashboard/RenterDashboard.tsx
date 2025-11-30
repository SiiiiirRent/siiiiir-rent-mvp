"use client";

import StatCard from "@/components/ui/StatCard";

export default function RenterDashboard({ uid }: { uid: string }) {
  // Pour l’instant on affiche des états vides
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Réservation en cours"
          value={"—"}
          hint="Aucune en cours"
        />
        <StatCard
          label="Prochaine réservation"
          value={"—"}
          hint="Aucune à venir"
        />
        <StatCard
          label="Historique (3 dernières)"
          value={"—"}
          hint="Rien pour le moment"
        />
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-2">Commencez ici</h2>
        <p className="text-sm text-slate-600">
          Utilisez la recherche pour trouver un véhicule et lancer votre
          première location.
        </p>
      </section>
    </div>
  );
}
