"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Vehicle } from "@/lib/types";
import { Calendar, User, Mail, Phone } from "lucide-react";

interface ReservationFormProps {
  vehicle: Vehicle;
  loueurId: string;
  currentUser: any;
}

export default function ReservationForm({
  vehicle,
  loueurId,
  currentUser,
}: ReservationFormProps) {
  const router = useRouter();

  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [nom, setNom] = useState(currentUser?.displayName || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [telephone, setTelephone] = useState(currentUser?.phoneNumber || "");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const calculateNbJours = () => {
    if (!dateDebut || !dateFin) return 0;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const diff = fin.getTime() - debut.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculatePrixTotal = () => {
    const nbJours = calculateNbJours();
    return nbJours * vehicle.prix;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // ✅ LOGS DEBUG
    console.log("🔍 currentUser:", currentUser);
    console.log("🔍 currentUser.uid:", currentUser?.uid);

    // 🚨 SÉCURITÉ CRITIQUE - Bloquer si pas de UID
    if (!currentUser?.uid) {
      console.error("🚨 SÉCURITÉ : Tentative réservation sans UID - BLOQUÉ");
      setErrorMessage(
        "⛔ Vous devez être connecté pour réserver. Rechargez la page et connectez-vous."
      );
      return;
    }

    console.log("✅ Sécurité OK - UID vérifié:", currentUser.uid);

    // Vérifications supplémentaires (sécurité défensive)
    if (!currentUser) {
      console.error("❌ currentUser est null");
      setErrorMessage("Vous devez être connecté pour réserver");
      return;
    }

    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);

    if (endDate < startDate) {
      setErrorMessage("La date de fin doit être après la date de début");
      return;
    }

    if (!nom || !email || !telephone) {
      setErrorMessage("Veuillez remplir tous les champs");
      return;
    }

    const nbJours = calculateNbJours();
    const prixTotal = calculatePrixTotal();

    // ✅ NOUVEAU : Séparer nom complet en prénom + nom de famille
    const nomCompletTrimmed = nom.trim();
    const nameParts = nomCompletTrimmed.split(" ");

    // Premier mot = prénom
    const prenom = nameParts[0] || "";

    // Reste = nom de famille (ou prénom si un seul mot)
    const nomFamille =
      nameParts.length > 1 ? nameParts.slice(1).join(" ") : nameParts[0] || "";

    console.log("📝 Nom complet:", nomCompletTrimmed);
    console.log("📝 Prénom:", prenom);
    console.log("📝 Nom famille:", nomFamille);

    const reservationData = {
      loueurId,
      vehicleId: vehicle.id,
      locataireId: currentUser.uid, // ✅ UID Firebase vérifié
      renterName: nomCompletTrimmed,
      nom: nomFamille, // ✅ NOUVEAU - Pour le PDF
      prenom: prenom, // ✅ NOUVEAU - Pour le PDF
      renterEmail: email,
      renterPhone: telephone,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      nbDays: nbJours,
      totalPrice: prixTotal,
      vehicleName: `${vehicle.marque} ${vehicle.modele}`,
      vehiclePhoto: vehicle.photos?.[0] || null,
    };

    console.log("📦 Données réservation:", reservationData);

    try {
      setSubmitting(true);

      const response = await fetch("/api/reservations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("❌ Erreur API:", data);
        setErrorMessage(
          data.error || "Erreur lors de la réservation. Réessayez."
        );
        return;
      }

      console.log("✅ Réservation créée:", data);
      alert("Votre demande de réservation a été envoyée !");
      router.push(`/loueur/${loueurId}`);
    } catch (error) {
      console.error("❌ Exception:", error);
      setErrorMessage("Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  const nbJours = calculateNbJours();
  const prixTotal = calculatePrixTotal();

  return (
    <div className="bg-white rounded-xl shadow-lg border p-6 sticky top-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Réserver ce véhicule
      </h2>

      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date début */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            <Calendar className="inline w-4 h-4 mr-2" />
            Date de début
          </label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            required
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Date fin */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            <Calendar className="inline w-4 h-4 mr-2" />
            Date de fin
          </label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            required
            min={dateDebut || new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Nom */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            <User className="inline w-4 h-4 mr-2" />
            Nom complet
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            placeholder="Ex: Aimad Benhammi"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            <Mail className="inline w-4 h-4 mr-2" />
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Téléphone */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            <Phone className="inline w-4 h-4 mr-2" />
            Téléphone
          </label>
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            required
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Prix total */}
        {nbJours > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2 text-sm">
              <span>
                {vehicle.prix} MAD × {nbJours} jour{nbJours > 1 ? "s" : ""}
              </span>
              <span className="font-semibold">{prixTotal} MAD</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-green-600">{prixTotal} MAD</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || nbJours === 0}
          className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Envoi en cours..." : "Réserver maintenant"}
        </button>
      </form>
    </div>
  );
}
