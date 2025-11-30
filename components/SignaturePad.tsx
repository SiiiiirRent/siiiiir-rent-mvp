"use client";

import { useRef, useState, useEffect } from "react";
import { X, Pen, Check } from "lucide-react";

interface SignaturePadProps {
  signature: string | null;
  onSignatureChange: (signature: string | null) => void;
  signerName: string;
}

export default function SignaturePad({
  signature,
  onSignatureChange,
  signerName,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("En attente...");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setDebugInfo("❌ Canvas non trouvé");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setDebugInfo("❌ Context non trouvé");
      return;
    }

    // Configurer le canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Style du crayon
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setContext(ctx);
    setDebugInfo(`✅ Canvas OK (${rect.width}x${rect.height})`);

    // Charger la signature existante
    if (signature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = signature;
    }
  }, [signature]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      const coords = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
      setDebugInfo(`📱 Touch: ${coords.x.toFixed(0)}, ${coords.y.toFixed(0)}`);
      return coords;
    } else {
      const coords = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setDebugInfo(`🖱️ Mouse: ${coords.x.toFixed(0)}, ${coords.y.toFixed(0)}`);
      return coords;
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setDebugInfo("🟢 START DRAWING");
    console.log("🟢 START DRAWING", e.type);

    if (!context) {
      setDebugInfo("❌ Pas de context");
      return;
    }

    const { x, y } = getCoordinates(e);
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
    setIsSigning(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDrawing || !context) return;

    const { x, y } = getCoordinates(e);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDrawing) return;

    setDebugInfo("🔴 STOP DRAWING");
    console.log("🔴 STOP DRAWING", e.type);

    setIsDrawing(false);
    setHasDrawn(true);

    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL("image/png");
      onSignatureChange(dataURL);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureChange(null);
    setHasDrawn(false);
    setIsSigning(false);
    setDebugInfo("🗑️ Effacé");
  };

  const handleSave = () => {
    if (!hasDrawn) {
      alert("Veuillez signer avant de valider");
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL("image/png");
      onSignatureChange(dataURL);
      setIsSigning(false);
    }
  };

  if (signature && !isSigning) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Signature validée</h3>
              <p className="text-sm text-gray-600">Signé par {signerName}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsSigning(true);
              setHasDrawn(false);
            }}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Modifier
          </button>
        </div>

        <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
          <img
            src={signature}
            alt="Signature"
            className="max-w-full h-auto mx-auto"
            style={{ maxHeight: "150px" }}
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
          <Check className="w-4 h-4" />
          <span>Signature enregistrée</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <Pen className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">✍️ Signature</h3>
          <p className="text-sm text-gray-600">
            Signez avec votre doigt - {signerName}
          </p>
        </div>
      </div>

      {/* DEBUG INFO */}
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-mono text-blue-900">{debugInfo}</p>
      </div>

      {/* Canvas de signature */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white mb-4 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          className="w-full h-48"
          style={{
            touchAction: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
            userSelect: "none",
            cursor: "crosshair",
          }}
        />

        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Signez ici</p>
          </div>
        )}
      </div>

      {hasDrawn && (
        <div className="mb-3 flex items-center gap-2 text-sm text-green-600">
          <Check className="w-4 h-4" />
          <span>Signature détectée</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleClear}
          type="button"
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg active:bg-gray-100 font-medium flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Effacer
        </button>
        <button
          onClick={handleSave}
          type="button"
          disabled={!hasDrawn}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg active:bg-green-800 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Valider
        </button>
      </div>
    </div>
  );
}
