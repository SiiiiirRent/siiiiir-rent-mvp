"use client";

import { useState } from "react";
import { Reservation } from "@/lib/types";
import { getUserProfile } from "@/lib/users";
import { getVehicle } from "@/lib/vehicles";
import {
  generateAndUploadContract,
  signContractAsOwner,
  signContractAsRenter,
  finalizeContract,
} from "@/lib/contracts";
import SignaturePad from "./SignaturePad";

interface ContractSectionProps {
  reservation: Reservation;
  onUpdate: () => void;
}

export default function ContractSection(props: ContractSectionProps) {
  const { reservation, onUpdate } = props;
  const [loading, setLoading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureType, setSignatureType] = useState<"owner" | "renter">(
    "owner"
  );

  async function handleGenerateContract() {
    if (!confirm("Générer le contrat de location ?")) return;
    try {
      setLoading(true);
      const ownerProfile = await getUserProfile(reservation.loueurId);
      if (!ownerProfile) throw new Error("Profil loueur introuvable");
      const vehicle = await getVehicle(reservation.vehicleId);
      if (!vehicle) throw new Error("Véhicule introuvable");
      const ownerInfo = {
        nom: ownerProfile.nom || "",
        prenom: ownerProfile.prenom || "",
        adresse: ownerProfile.adresse || "",
        telephone: ownerProfile.telephone || "",
        email: ownerProfile.email,
        companyName: ownerProfile.companyInfo?.nomSociete,
        ice: ownerProfile.companyInfo?.ice,
      };
      const vehicleInfo = {
        immatriculation: vehicle.immatriculation || "N/A",
        annee: vehicle.annee,
        type: vehicle.type,
        transmission: vehicle.transmission,
      };
      await generateAndUploadContract(
        reservation.id,
        reservation,
        ownerInfo,
        vehicleInfo
      );
      alert("✅ Contrat généré avec succès !");
      onUpdate();
    } catch (error: any) {
      console.error("Erreur génération contrat:", error);
      alert("❌ Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenSignaturePad(type: "owner" | "renter") {
    setSignatureType(type);
    setShowSignaturePad(true);
  }

  async function handleSaveSignature(signatureDataURL: string) {
    try {
      setLoading(true);
      setShowSignaturePad(false);
      if (signatureType === "owner") {
        await signContractAsOwner(reservation.id, signatureDataURL);
      } else {
        await signContractAsRenter(reservation.id, signatureDataURL);
      }
      const ownerProfile = await getUserProfile(reservation.loueurId);
      const vehicle = await getVehicle(reservation.vehicleId);
      if (!ownerProfile || !vehicle) throw new Error("Données manquantes");
      const ownerInfo = {
        nom: ownerProfile.nom || "",
        prenom: ownerProfile.prenom || "",
        adresse: ownerProfile.adresse || "",
        telephone: ownerProfile.telephone || "",
        email: ownerProfile.email,
        companyName: ownerProfile.companyInfo?.nomSociete,
        ice: ownerProfile.companyInfo?.ice,
      };
      const vehicleInfo = {
        immatriculation: vehicle.immatriculation || "N/A",
        annee: vehicle.annee,
        type: vehicle.type,
        transmission: vehicle.transmission,
      };
      await generateAndUploadContract(
        reservation.id,
        reservation,
        ownerInfo,
        vehicleInfo,
        signatureType === "owner"
          ? signatureDataURL
          : reservation.contract?.ownerSignature,
        signatureType === "renter"
          ? signatureDataURL
          : reservation.contract?.renterSignature
      );
      const bothSigned =
        (signatureType === "owner" && reservation.contract?.signedByRenter) ||
        (signatureType === "renter" && reservation.contract?.signedByOwner);
      if (bothSigned) await finalizeContract(reservation.id);
      alert("✅ Signature enregistrée !");
      onUpdate();
    } catch (error: any) {
      console.error("Erreur signature:", error);
      alert("❌ Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const contract = reservation.contract;
  const hasContract = !!contract?.url;
  const ownerSigned = contract?.signedByOwner;
  const renterSigned = contract?.signedByRenter;
  const bothSigned = ownerSigned && renterSigned;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        📄 Contrat de location
      </h3>
      {!hasContract ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Aucun contrat généré pour cette réservation
          </p>
          <button
            onClick={handleGenerateContract}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
          >
            {loading ? "⏳ Génération..." : "📄 Générer le contrat"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Statut des signatures
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Loueur (vous)</span>
                {ownerSigned ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    ✅ Signé
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                    ⏳ En attente
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Locataire</span>
                {renterSigned ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    ✅ Signé
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                    ⏳ En attente
                  </span>
                )}
              </div>
            </div>
            {bothSigned && contract.signedAt && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium text-center">
                  ✅ Contrat entièrement signé
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={contract.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-50 text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-100 transition font-semibold text-center"
            >
              👁️ Voir le contrat
            </a>
            <a
              href={contract.url}
              download
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition font-semibold text-center"
            >
              📥 Télécharger
            </a>
          </div>
          {!bothSigned && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              {!ownerSigned && (
                <button
                  onClick={() => handleOpenSignaturePad("owner")}
                  disabled={loading}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                >
                  ✍️ Signer le contrat (Loueur)
                </button>
              )}
              {!renterSigned && (
                <button
                  onClick={() => handleOpenSignaturePad("renter")}
                  disabled={loading}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                >
                  ✍️ Signer le contrat (Locataire)
                </button>
              )}
              <p className="text-xs text-gray-500 text-center">
                Note : En production, le locataire signera depuis son interface
              </p>
            </div>
          )}
          <button
            onClick={handleGenerateContract}
            disabled={loading || bothSigned}
            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition font-semibold disabled:opacity-50"
          >
            🔄 Régénérer le contrat
          </button>
          {bothSigned && (
            <p className="text-xs text-red-600 text-center">
              ⚠️ Le contrat ne peut plus être modifié après signature complète
            </p>
          )}
        </div>
      )}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleSaveSignature}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}
    </div>
  );
}
