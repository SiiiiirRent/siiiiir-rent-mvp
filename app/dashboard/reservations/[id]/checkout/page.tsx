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

export default function CheckOutPage() {
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

  useEffect(() => {
    loadData();
  }, [reservationId]);

  const loadData = async () => {
    try {
      const reservationDoc = await getDoc(
        doc(db, "reservations", reservationId)
      );
      if (reservationDoc.exists()) {
        const reservationData = {
          id: reservationDoc.id,
          ...reservationDoc.data(),
        } as Reservation;
        setReservation(reservationData);

        const vehicleDoc = await getDoc(
          doc(db, "vehicles", reservationData.vehicleId)
        );
        if (vehicleDoc.exists()) {
          setVehicle({
            id: vehicleDoc.id,
            ...vehicleDoc.data(),
          } as Vehicle);
        }
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

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
        type: "checkout",
        signerName: user?.displayName || user?.email || "Loueur",
      });

      // 2. Upload PDF vers Firebase Storage
      const timestamp = Date.now();
      const fileName = `etat_lieux_sortie_${timestamp}.pdf`;
      const filePath = `inspections/${reservationId}/checkout/${fileName}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, pdfBlob);
      const pdfURL = await getDownloadURL(storageRef);

      // 3. Sauvegarder dans Firestore
      const inspectionId = `${reservationId}_checkout`;
      const inspectionRef = doc(db, "inspections", inspectionId);

      await setDoc(inspectionRef, {
        id: inspectionId,
        reservationId: reservationId,
        vehicleId: reservation.vehicleId,
        loueurId: reservation.loueurId,
        locataireId: reservation.locataireId,
        type: "checkout",
        photos: photos.map((photo) => ({
          url: photo.url,
          category: photo.category,
          uploadedAt: photo.uploadedAt,
          uploadedBy: "loueur",
        })),
        checklist: checklist,
        observations: observations,
        signature: signature,
        signedBy: "loueur",
        signedAt: Timestamp.now(),
        pdfUrl: pdfURL,
        status: "termine",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
      });

      alert("État des lieux enregistré avec succès !");

      // 4. Rediriger vers la page réservation
      router.push(`/dashboard/reservations/${reservationId}`);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!reservation || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Réservation non trouvée</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-green-600 hover:text-green-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                État des lieux - Sortie (Check-out)
              </h1>
              <p className="text-sm text-gray-600">
                {vehicle.marque} {vehicle.modele} - {vehicle.immatriculation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">À propos de l'état des lieux</p>
              <p>
                L'état des lieux de sortie doit être rempli{" "}
                <strong>au retour</strong> du véhicule par le locataire.
                Comparez l'état du véhicule avec l'état des lieux d'entrée et
                notez tous les changements ou dommages.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section Photos */}
          <PhotoUploadSection
            reservationId={reservationId}
            inspectionType="checkout"
            photos={photos}
            onPhotosChange={setPhotos}
          />

          {/* Section Checklist */}
          <ChecklistForm
            checklist={checklist}
            onChecklistChange={setChecklist}
          />

          {/* Observations */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              📝 Observations générales
            </h3>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Notez ici toute information importante non couverte par la checklist..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              rows={4}
            />
          </div>

          {/* Signature */}
          <SignaturePad
            signature={signature}
            onSignatureChange={setSignature}
            signerName={user?.displayName || user?.email || "Loueur"}
          />
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => router.back()}
            disabled={saving}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!signature || saving}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Enregistrement...</span>
              </>
            ) : (
              "Enregistrer et générer le PDF"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
