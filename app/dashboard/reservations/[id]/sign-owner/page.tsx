"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

import { ref, uploadString } from "firebase/storage";

export default function OwnerSignPage() {
  const { id } = useParams();
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const docRef = doc(db, "reservations", id as string);
    const snap = await getDoc(docRef);

    if (snap.exists()) setReservation(snap.data());
    setLoading(false);
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL("image/png");

    const uploadRef = ref(storage, `contracts/signatures/owner-${id}.png`);
    await uploadString(uploadRef, dataUrl, "data_url");

    const signatureUrl = await uploadString(uploadRef, dataUrl, "data_url");

    await updateDoc(doc(db, "reservations", id as string), {
      contractOwnerSigned: true,
      ownerSignedAt: Timestamp.now(),
    });

    alert("Signature enregistrée !");
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Signature du contrat (Loueur)</h1>

      <a
        href={reservation.contractUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        Voir le contrat PDF
      </a>

      <div>
        <p className="font-medium mb-2">Signez ci-dessous :</p>
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="border rounded"
        />
      </div>

      <div className="flex gap-3">
        <button onClick={clear} className="px-4 py-2 bg-gray-200 rounded">
          Effacer
        </button>

        <button
          onClick={saveSignature}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Enregistrer la signature
        </button>
      </div>
    </div>
  );
}
