"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, FileCheck, FileText, Download } from "lucide-react";
import { Reservation } from "@/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface InspectionButtonsProps {
  reservation: Reservation;
}

interface InspectionData {
  id: string;
  pdfUrl: string;
  status: string;
  completedAt?: any;
}

export default function InspectionButtons({
  reservation,
}: InspectionButtonsProps) {
  const router = useRouter();
  const [checkinData, setCheckinData] = useState<InspectionData | null>(null);
  const [checkoutData, setCheckoutData] = useState<InspectionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspections();
  }, [reservation.id]);

  const loadInspections = async () => {
    try {
      // Charger check-in
      const checkinRef = doc(db, "inspections", `${reservation.id}_checkin`);
      const checkinSnap = await getDoc(checkinRef);
      if (checkinSnap.exists()) {
        setCheckinData(checkinSnap.data() as InspectionData);
      }

      // Charger check-out
      const checkoutRef = doc(db, "inspections", `${reservation.id}_checkout`);
      const checkoutSnap = await getDoc(checkoutRef);
      if (checkoutSnap.exists()) {
        setCheckoutData(checkoutSnap.data() as InspectionData);
      }
    } catch (error) {
      console.error("Erreur chargement inspections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    router.push(`/dashboard/reservations/${reservation.id}/checkin`);
  };

  const handleCheckOut = () => {
    router.push(`/dashboard/reservations/${reservation.id}/checkout`);
  };

  const handleViewPDF = (url: string) => {
    window.open(url, "_blank");
  };

  const handleDownloadPDF = (url: string, type: "checkin" | "checkout") => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `etat_lieux_${type === "checkin" ? "entree" : "sortie"}_${
      reservation.id
    }.pdf`;
    link.click();
  };

  // Afficher uniquement si la réservation est confirmée
  if (
    reservation.status !== "confirmee" &&
    reservation.status !== "en_cours" &&
    reservation.status !== "terminee"
  ) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        📋 États des lieux
      </h3>

      <div className="space-y-3">
        {/* Check-in */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  checkinData ? "bg-green-100" : "bg-gray-200"
                }`}
              >
                <ClipboardList
                  className={`w-5 h-5 ${
                    checkinData ? "text-green-600" : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  État des lieux - Entrée
                </p>
                <p className="text-sm text-gray-600">
                  {checkinData
                    ? "Complété"
                    : "À remplir avant la remise des clés"}
                </p>
              </div>
            </div>
            {!checkinData && (
              <button
                onClick={handleCheckIn}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Remplir
              </button>
            )}
          </div>

          {checkinData && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleViewPDF(checkinData.pdfUrl)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                Voir le PDF
              </button>
              <button
                onClick={() => handleDownloadPDF(checkinData.pdfUrl, "checkin")}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            </div>
          )}
        </div>

        {/* Check-out */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  checkoutData ? "bg-green-100" : "bg-gray-200"
                }`}
              >
                <FileCheck
                  className={`w-5 h-5 ${
                    checkoutData ? "text-green-600" : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  État des lieux - Sortie
                </p>
                <p className="text-sm text-gray-600">
                  {checkoutData
                    ? "Complété"
                    : "À remplir au retour du véhicule"}
                </p>
              </div>
            </div>
            {!checkoutData && (
              <button
                onClick={handleCheckOut}
                disabled={!checkinData && reservation.status !== "terminee"}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !checkinData && reservation.status !== "terminee"
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                Remplir
              </button>
            )}
          </div>

          {checkoutData && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleViewPDF(checkoutData.pdfUrl)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                Voir le PDF
              </button>
              <button
                onClick={() =>
                  handleDownloadPDF(checkoutData.pdfUrl, "checkout")
                }
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note d'info */}
      {!checkinData && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Conseil :</strong> Remplissez l'état des lieux d'entrée
            avec le locataire avant de remettre les clés. Cela protège les deux
            parties.
          </p>
        </div>
      )}
    </div>
  );
}
