"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { Reservation, ContractSettings } from "@/lib/types";
import { doc, updateDoc, Timestamp, getDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateContractPDF } from "@/lib/generateContractPDF";
import { useAuth } from "@/context/AuthContext";
import SignaturePad from "@/components/reservations/SignaturePad";

interface ContractSectionProps {
  reservation: Reservation;
  onUpdate: () => void;
}

export default function ContractSection({
  reservation,
  onUpdate,
}: ContractSectionProps) {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [signing, setSigning] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const contract = reservation.contract;

  // ✅ FONCTION HELPER : Charger les contract settings
  const loadContractSettings = async (
    userId: string
  ): Promise<ContractSettings | undefined> => {
    try {
      const settingsDoc = await getDoc(
        doc(db, "users", userId, "settings", "contract")
      );
      if (settingsDoc.exists()) {
        return settingsDoc.data() as ContractSettings;
      }
    } catch (error) {
      console.warn("⚠️ Impossible de charger contract settings:", error);
    }
    return undefined;
  };

  // -----------------------------
  // Génération du contrat (PDF)
  // -----------------------------
  const handleGenerateContract = async () => {
    if (!user) return;

    setGenerating(true);

    try {
      // ✅ RÉCUPÉRER LES CONTRACT SETTINGS
      const contractSettings = await loadContractSettings(user.uid);

      // ✅ RÉCUPÉRER LES INFOS DU LOUEUR DEPUIS FIRESTORE (fallback)
      let loueurNom = user.displayName || user.email || "Loueur";
      let loueurTel = "";
      let loueurAdresse = "";
      let loueurEmail = "";
      let loueurSociete = "";
      let loueurVille = "";
      let loueurPays = "";

      try {
        const loueurDoc = await getDoc(doc(db, "users", user.uid));
        if (loueurDoc.exists()) {
          const loueurData = loueurDoc.data();

          loueurNom =
            loueurData.displayName ||
            `${loueurData.prenom || ""} ${loueurData.nom || ""}`.trim() ||
            loueurNom;

          const companyInfo = loueurData.companyInfo || {};

          loueurTel =
            companyInfo.telephoneSociete || loueurData.telephone || "";
          loueurAdresse =
            companyInfo.adresseSociete || loueurData.adresse || "";
          loueurEmail = loueurData.email || "";
          loueurSociete = companyInfo.nomSociete || "";
          loueurVille = companyInfo.villeSociete || loueurData.ville || "";
          loueurPays = loueurData.pays || "";

          console.log("📋 Infos loueur récupérées pour génération:", {
            nom: loueurNom,
            societe: loueurSociete,
            tel: loueurTel,
            adresse: loueurAdresse,
            ville: loueurVille,
            pays: loueurPays,
            email: loueurEmail,
          });
        }
      } catch (error) {
        console.warn("⚠️ Impossible de charger infos loueur:", error);
      }

      const pdfBlob = await generateContractPDF({
        reservation,
        loueurNom,
        loueurTel,
        loueurAdresse,
        loueurEmail,
        loueurSociete,
        loueurVille,
        loueurPays,
        contractSettings, // ✅ Passé ici
      });

      const timestamp = Date.now();
      const fileName = `contrat_${timestamp}.pdf`;
      const filePath = `contracts/${reservation.id}/${fileName}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, pdfBlob);
      const pdfURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "reservations", reservation.id), {
        contract: {
          url: pdfURL,
          generatedAt: Timestamp.now(),
          signedByOwner: false,
          signedByRenter: false,
        },
        updatedAt: Timestamp.now(),
      });

      alert("Contrat généré avec succès !");
      onUpdate();
    } catch (error) {
      console.error("Erreur génération contrat:", error);
      alert("Erreur lors de la génération du contrat");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenSignatureModal = () => {
    setShowSignatureModal(true);
    setSignatureData(null);
  };

  const handleCancelSignature = () => {
    setShowSignatureModal(false);
    setSignatureData(null);
  };

  // -----------------------------
  // Signature du loueur
  // -----------------------------
  const handleSaveSignature = async (signature: string) => {
    if (!user || !contract) return;

    setSigning(true);

    try {
      console.log("📝 Sauvegarde de la signature...");

      // 1) base64 -> Blob
      const base64Data = signature.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteArrays: number[] = [];

      for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i));
      }

      const blob = new Blob([new Uint8Array(byteArrays)], {
        type: "image/png",
      });

      // 2) Upload de la signature
      const timestamp = Date.now();
      const fileName = `signature_loueur_${timestamp}.png`;
      const filePath = `signatures/${reservation.id}/${fileName}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, blob);
      const signatureURL = await getDownloadURL(storageRef);

      console.log("✅ Signature uploadée:", signatureURL);

      // 3) Déterminer la signature du locataire
      const renterSignatureBase64 =
        contract.renterSignatureBase64 ||
        (reservation as any).renterSignature ||
        null;

      // 4) Mettre à jour la réservation avec la signature loueur
      await updateDoc(doc(db, "reservations", reservation.id), {
        "contract.signedByOwner": true,
        "contract.ownerSignedAt": Timestamp.now(),
        "contract.ownerSignatureUrl": signatureURL,
        "contract.ownerSignatureBase64": signature,
        ...(renterSignatureBase64 && { "contract.signedByRenter": true }),
        updatedAt: Timestamp.now(),
      });

      console.log("✅ Contrat mis à jour dans Firestore");

      // 5) ✅ RÉCUPÉRER LES CONTRACT SETTINGS
      const contractSettings = await loadContractSettings(user.uid);

      // 6) ✅ RÉCUPÉRER LES INFOS DU LOUEUR POUR RÉGÉNÉRATION
      let loueurNom = user.displayName || user.email || "Loueur";
      let loueurTel = "";
      let loueurAdresse = "";
      let loueurEmail = "";
      let loueurSociete = "";
      let loueurVille = "";
      let loueurPays = "";

      try {
        const loueurDoc = await getDoc(doc(db, "users", user.uid));
        if (loueurDoc.exists()) {
          const loueurData = loueurDoc.data();

          loueurNom =
            loueurData.displayName ||
            `${loueurData.prenom || ""} ${loueurData.nom || ""}`.trim() ||
            loueurNom;

          const companyInfo = loueurData.companyInfo || {};

          loueurTel =
            companyInfo.telephoneSociete || loueurData.telephone || "";
          loueurAdresse =
            companyInfo.adresseSociete || loueurData.adresse || "";
          loueurEmail = loueurData.email || "";
          loueurSociete = companyInfo.nomSociete || "";
          loueurVille = companyInfo.villeSociete || loueurData.ville || "";
          loueurPays = loueurData.pays || "";

          console.log("📋 Infos loueur récupérées pour signature:", {
            nom: loueurNom,
            societe: loueurSociete,
            tel: loueurTel,
            adresse: loueurAdresse,
            ville: loueurVille,
            pays: loueurPays,
            email: loueurEmail,
          });
        }
      } catch (error) {
        console.warn("⚠️ Impossible de charger infos loueur:", error);
      }

      // 7) Régénérer le PDF avec les signatures dispo
      console.log("📄 Régénération du PDF avec la signature...");

      const pdfBlob = await generateContractPDF({
        reservation,
        loueurNom,
        loueurTel,
        loueurAdresse,
        loueurEmail,
        loueurSociete,
        loueurVille,
        loueurPays,
        ownerSignatureBase64: signature,
        renterSignatureBase64: renterSignatureBase64 || undefined,
        contractSettings, // ✅ Passé ici
      });

      const pdfTimestamp = Date.now();
      const pdfFileName = `contrat_${pdfTimestamp}.pdf`;
      const pdfFilePath = `contracts/${reservation.id}/${pdfFileName}`;
      const pdfStorageRef = ref(storage, pdfFilePath);

      await uploadBytes(pdfStorageRef, pdfBlob);
      const pdfURL = await getDownloadURL(pdfStorageRef);

      console.log("✅ Nouveau PDF uploadé:", pdfURL);

      await updateDoc(doc(db, "reservations", reservation.id), {
        "contract.url": pdfURL,
        updatedAt: Timestamp.now(),
      });

      console.log("✅ Contrat régénéré avec succès");

      setShowSignatureModal(false);
      alert("Contrat signé et régénéré avec succès !");
      onUpdate();
    } catch (error) {
      console.error("❌ Erreur signature:", error);
      alert("Erreur lors de la signature");
    } finally {
      setSigning(false);
    }
  };

  // -----------------------------
  // Si pas de contrat : UI "Générer"
  // -----------------------------
  if (!contract) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          Contrat de location
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          Générez le contrat de location pour cette réservation.
        </p>

        <button
          onClick={handleGenerateContract}
          disabled={generating || reservation.status !== "confirmee"}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Génération...</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Générer le contrat
            </>
          )}
        </button>

        {reservation.status !== "confirmee" && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            La réservation doit être confirmée pour générer le contrat
          </p>
        )}
      </div>
    );
  }

  // -----------------------------
  // Statuts signatures
  // -----------------------------
  const ownerHasSigned =
    !!contract.signedByOwner || !!contract.ownerSignatureBase64;

  const renterHasSigned =
    !!contract.signedByRenter ||
    !!contract.renterSignatureBase64 ||
    !!(reservation as any).renterSignature;

  const isFullySigned = ownerHasSigned && renterHasSigned;
  const isPartiallySigned = ownerHasSigned || renterHasSigned;

  // -----------------------------
  // Actions Voir / Télécharger
  // -----------------------------
  const handleViewContract = () => {
    if (contract.url) {
      window.open(contract.url, "_blank");
    }
  };

  const handleDownloadContract = () => {
    if (contract.url) {
      const link = document.createElement("a");
      link.href = contract.url;
      link.download = `contrat_${reservation.id}.pdf`;
      link.click();
    }
  };

  // -----------------------------
  // UI principale (contrat existant)
  // -----------------------------
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          Contrat de location
        </h3>

        {/* Statut loueur */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Loueur</span>
            <div className="flex items-center gap-2">
              {ownerHasSigned ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Signé
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-gray-400" />
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    Non signé
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Statut locataire */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Locataire</span>
            <div className="flex items-center gap-2">
              {renterHasSigned ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Signé
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-gray-400" />
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    Non signé
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages d'état */}
        {isFullySigned && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Contrat entièrement signé
              </span>
            </div>
          </div>
        )}

        {!isFullySigned && isPartiallySigned && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                En attente de signature
              </span>
            </div>
          </div>
        )}

        {/* Boutons */}
        <div className="space-y-2">
          {!ownerHasSigned && (
            <button
              onClick={handleOpenSignatureModal}
              disabled={signing}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              Signer le contrat
            </button>
          )}

          <button
            onClick={handleViewContract}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Voir le contrat
          </button>

          <button
            onClick={handleDownloadContract}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Télécharger
          </button>
        </div>

        {isFullySigned && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Le contrat ne peut plus être modifié après signature complète
            </p>
          </div>
        )}
      </div>

      {/* Modal de signature */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                ✍️ Signature du contrat
              </h3>
              <button
                onClick={handleCancelSignature}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              En signant ce contrat, vous vous engagez à respecter les
              conditions de location.
            </p>

            <SignaturePad
              onSave={handleSaveSignature}
              onCancel={handleCancelSignature}
            />

            {signing && (
              <div className="mt-4 flex items-center justify-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                <span>Enregistrement de la signature...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
