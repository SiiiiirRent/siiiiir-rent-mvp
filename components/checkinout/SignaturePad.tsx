"use client";

import { useRef, useState, useEffect } from "react";
import { X, Pen, Check } from "lucide-react";

interface SignaturePadProps {
  onSave: (signature: string) => void;
  label: string;
}

export default function SignaturePad({ onSave, label }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
  }, []);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!context) return;

    const { x, y } = getCoordinates(e);
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
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

    setIsDrawing(false);
    setHasDrawn(true);

    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL("image/png");
      setSignature(dataURL);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSignature(null);
  };

  const handleValidate = () => {
    if (!hasDrawn || !signature) {
      alert("Veuillez signer avant de valider");
      return;
    }

    onSave(signature);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <Pen className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">✍️ {label}</h3>
          <p className="text-sm text-gray-600">
            Signez avec votre doigt ou votre souris
          </p>
        </div>
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
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Effacer
        </button>
        <button
          onClick={handleValidate}
          type="button"
          disabled={!hasDrawn}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Valider
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500 text-center">
        En signant, vous confirmez l'exactitude des informations
      </p>
    </div>
  );
}
