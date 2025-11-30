"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  Reservation,
  Vehicle,
  InspectionPhoto,
  InspectionChecklist,
  defaultChecklist,
} from "@/lib/types";
import { ArrowLeft, FileText } from "lucide-react";
import PhotoUploadSection from "@/components/PhotoUploadSection";
import ChecklistForm from "@/components/ChecklistForm";
import SignaturePad from "@/components/SignaturePad";
import { generateInspectionPDF } from "@/lib/generateInspectionPDF";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reservationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [checklist, setChecklist] =
    useState<InspectionChecklist>(defaultChecklist);
  const [observations, setObservations] = useState("");
  const [signature, setSignature] = useState<string | null>(null);

  // ================================================
  // 📌 CHARGEMENT RÉSERVATION + VÉHICULE
  // ================================================
  useEffect(() => {
    loadData();
  }, [reservationId]);

  const loadData = async () => {
    try {
      const reservationSnap = await getDoc(
        doc(db, "reservations", reservationId)
      );

      if (reservationSnap.exists()) {
        const reservationData = {
          id: reservationSnap.id,
          ...reservationSnap.data(),
        } as Reservation;
        setReservation(reservationData);

        const vehicleSnap = await getDoc(
          doc(db, "vehicles", reservationData.vehicleId)
        );

        if (vehicleSnap.exists()) {
          setVehicle({
            id: vehicleSnap.id,
            ...vehicleSnap.data(),
          } as Vehicle);
        }
      }
    } catch (error) {
      console.error("Erreur chargement réservation :", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 📌 ENREGISTREMENT CHECK-IN
  // =========================================================
  const handleSave = async () => {
    if (!signature) {
      alert("Veuillez signer l'état des lieux avant de continuer");
      return;
    }

    if (!reservation || !vehicle || !user) return;

    setSaving(true);

    try {
      // 1. Générer le PDF
      const pdfBlob = await generateInspectionPDF({
        reservation,
        vehicle,
        photos,
        checklist,
        observations,
        signature,
        type: "checkin",
        signerName: user.displayName || user.email || "Loueur",
      });

      // 2. Upload PDF dans Storage
      const timestamp = Date.now();
      const fileName = `etat_lieux_entree_${timestamp}.pdf`;
      const filePath = `inspections/${reservationId}/checkin/${fileName}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, pdfBlob);
      const pdfURL = await getDownloadURL(storageRef);

      // 3. Sauvegarde Firestore
      const inspectionId = `${reservationId}_checkin`;
      await setDoc(doc(db, "inspections", inspectionId), {
        id: inspectionId,
        reservationId,
        vehicleId: reservation.vehicleId,
        loueurId: reservation.loueurId,
        locataireId: reservation.locataireId,
        type: "checkin",
        photos: photos.map((p) => ({
          url: p.url,
          category: p.category,
          uploadedAt: p.uploadedAt,
          uploadedBy: "loueur",
        })),
        checklist,
        observations,
        signature,
        signedBy: "loueur",
        signedAt: Timestamp.now(),
        pdfUrl: pdfURL,
        status: "termine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      alert("État des lieux enregistré avec succès !");
      router.push(`/dashboard/reservations/${reservationId}`);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // ================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement...
      </div>
    );
  }

  if (!reservation || !vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Réservation non trouvée
      </div>
    );
  }

  // ================================================
  // 🔵 AFFICHAGE UI
  // ================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl font-bold">
              État des lieux - Entrée (Check-in)
            </h1>
            <p className="text-sm text-gray-600">
              {vehicle.marque} {vehicle.modele} – {vehicle.immatriculation}
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Photos */}
        <PhotoUploadSection
          reservationId={reservationId}
          inspectionType="checkin"
          photos={photos}
          onPhotosChange={setPhotos}
        />

        {/* Checklist */}
        <ChecklistForm checklist={checklist} onChecklistChange={setChecklist} />

        {/* Observations */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="font-semibold mb-2">📝 Observations</h3>
          <textarea
            className="w-full p-3 border rounded-lg"
            rows={4}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Notes supplémentaires..."
          />
        </div>

        {/* Signature */}
        <SignaturePad
          signature={signature}
          onSignatureChange={setSignature}
          signerName={user?.displayName || user?.email || "Loueur"}
        />

        {/* Boutons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border rounded-lg"
          >
            Annuler
          </button>

          <button
            onClick={handleSave}
            disabled={!signature || saving}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg"
          >
            {saving ? "Enregistrement..." : "Enregistrer et générer le PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
