"use client";

import { FileText, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Reservation } from "@/lib/types";

interface ContractCardProps {
  reservation: Reservation;
}

export default function ContractCard({ reservation }: ContractCardProps) {
  // ✅ On base le statut sur les vrais champs Firestore
  const isOwnerSigned =
    !!(reservation as any).ownerSignature ||
    !!(reservation as any).ownerSignedAt;

  const isRenterSigned =
    !!(reservation as any).renterSignature ||
    !!(reservation as any).renterSignedAt;

  const contractUrl = (reservation as any).contractUrl as string | undefined;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-green-50">
          <FileText className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Contrat de location
          </h2>
          <p className="text-xs text-gray-500">
            Statut des signatures et accès au contrat PDF.
          </p>
        </div>
      </div>

      {/* Statuts loueur / locataire */}
      <div className="space-y-2 text-sm">
        {/* Loueur */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Loueur</span>
          <div className="flex items-center gap-1">
            {isOwnerSigned ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">Signé</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Non signé</span>
              </>
            )}
          </div>
        </div>

        {/* Locataire */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Locataire</span>
          <div className="flex items-center gap-1">
            {isRenterSigned ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">Signé</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Non signé</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Message d’info */}
      {!isRenterSigned && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-100 px-3 py-2 text-xs text-yellow-800">
          En attente de signature du locataire.
        </div>
      )}

      {/* Boutons contrat */}
      <div className="flex flex-col gap-2">
        {contractUrl ? (
          <>
            <a
              href={contractUrl}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Voir le contrat
            </a>
            <a
              href={contractUrl}
              target="_blank"
              download
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Télécharger
            </a>
          </>
        ) : (
          <p className="text-xs text-gray-400">
            Le contrat PDF n’est pas encore généré.
          </p>
        )}
      </div>
    </div>
  );
}
