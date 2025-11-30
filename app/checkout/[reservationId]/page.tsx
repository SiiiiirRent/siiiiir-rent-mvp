"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Reservation, CheckPhoto } from "@/lib/types";
import { getReservationForCheck, saveCheckout } from "@/lib/checkinout";
import PhotoUploadSection from "@/components/checkinout/PhotoUploadSection";
import SignaturePad from "@/components/checkinout/SignaturePad";

export default function CheckOutPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reservationId = params.reservationId as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [photos, setPhotos] = useState<CheckPhoto[]>([]);
  const [kilometrage, setKilometrage] = useState<number>(0);
  const [carburant, setCarburant] = useState<string>("plein");
  const [notes, setNotes] = useState<string>("");
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
        router.push("/");
        return;
      }

      // Vérifier que l'utilisateur est bien le locataire
      if (user && res.locataireId !== user.uid) {
        alert("❌ Accès refusé : vous n'êtes pas le locataire");
        router.push("/");
        return;
      }

      // Vérifier que le check-in a été fait
      if (!res.checkin) {
        alert("❌ Le check-in n'a pas encore été fait");
        router.push("/");
        return;
      }

      setReservation(res);
    } catch (error) {
      console.error("❌ Erreur chargement réservation:", error);
      alert("❌ Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotosUpdate = (updatedPhotos: CheckPhoto[]) => {
    setPhotos(updatedPhotos);
  };

  const handleSignatureSave = (signatureBase64: string) => {
    setSignature(signatureBase64);
    alert("✅ Signature enregistrée");
  };

  const handleSubmit = async () => {
    // Validations
    if (photos.length < 7) {
      alert("❌ Veuillez prendre toutes les photos obligatoires");
      return;
    }

    if (kilometrage <= 0) {
      alert("❌ Veuillez entrer le kilométrage");
      return;
    }

    if (!signature) {
      alert("❌ Veuillez signer avant de valider");
      return;
    }

    if (!user) {
      alert("❌ Vous devez être connecté");
      return;
    }

    try {
      setSaving(true);

      await saveCheckout(
        reservationId,
        {
          photos,
          kilometrage,
          carburant,
          notes,
          signatureLocataire: signature,
        },
        user.uid
      );

      alert(
        "✅ Check-out enregistré avec succès !\n\nLe loueur va le valider."
      );
      router.push("/espace-locataire");
    } catch (error: any) {
      console.error("❌ Erreur sauvegarde check-out:", error);
      alert(`❌ Erreur : ${error.message}`);
    } finally {
      setSaving(false);
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

  if (!reservation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-900">Réservation introuvable</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            📋 Check-out - État des lieux de sortie
          </h1>
          <p className="text-gray-600">
            Prenez des photos du véhicule au retour
          </p>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Véhicule :</strong> {reservation.vehicleMarque}{" "}
              {reservation.vehicleModele}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <strong>Kilométrage check-in :</strong>{" "}
              {reservation.checkin?.kilometrage} km
            </p>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <PhotoUploadSection
            reservationId={reservationId}
            userId={user?.uid || ""}
            checkType="checkout"
            onPhotosUpdate={handlePhotosUpdate}
          />
        </div>

        {/* Kilométrage + Carburant */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            🚗 Informations véhicule
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kilométrage actuel *
              </label>
              <input
                type="number"
                value={kilometrage}
                onChange={(e) => setKilometrage(Number(e.target.value))}
                placeholder="Ex: 45200"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Check-in : {reservation.checkin?.kilometrage} km
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau de carburant *
              </label>
              <select
                value={carburant}
                onChange={(e) => setCarburant(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="plein">⛽ Plein</option>
                <option value="3/4">⛽ 3/4</option>
                <option value="1/2">⛽ 1/2</option>
                <option value="1/4">⛽ 1/4</option>
                <option value="vide">⛽ Vide</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Check-in : {reservation.checkin?.carburant}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarques (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ex: Nouvelle rayure sur la portière..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Signature */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <SignaturePad
            onSave={handleSignatureSave}
            label="Votre signature (locataire)"
          />
        </div>

        {/* Bouton validation */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <button
            onClick={handleSubmit}
            disabled={saving || photos.length < 7 || !signature}
            className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "⏳ Enregistrement..." : "✅ Valider le check-out"}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Le loueur recevra une notification et validera l'état des lieux
          </p>
        </div>
      </div>
    </div>
  );
}
