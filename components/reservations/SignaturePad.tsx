"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  onSave: (signatureDataURL: string) => void;
  onCancel: () => void;
}

export default function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Veuillez signer avant de valider");
      return;
    }

    const dataURL = sigCanvas.current?.toDataURL("image/png");
    if (dataURL) {
      onSave(dataURL);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          ✍️ Signature du contrat
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          Signez dans le cadre ci-dessous avec votre doigt ou votre souris
        </p>

        {/* Canvas de signature */}
        <div className="border-2 border-gray-300 rounded-lg bg-white mb-4 overflow-hidden">
          <SignatureCanvas
            ref={sigCanvas}
            onBegin={handleBegin}
            canvasProps={{
              className: "w-full h-64 cursor-crosshair",
            }}
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition font-semibold"
          >
            🗑️ Effacer
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition font-semibold"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isEmpty}
            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Valider la signature
          </button>
        </div>
      </div>
    </div>
  );
}
