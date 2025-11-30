// src/lib/regenerateContract.ts

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateContractPDF } from "@/lib/generateContractPDF";

export async function regenerateContract(reservationId: string) {
  // 1) Récupérer la réservation
  const reservationRef = doc(db, "reservations", reservationId);
  const snap = await getDoc(reservationRef);

  if (!snap.exists()) {
    throw new Error("Réservation introuvable !");
  }

  const data = snap.data() as any;

  // 2) Générer le PDF avec les signatures dispo
  const pdfBlob = await generateContractPDF({
    reservation: {
      id: snap.id,
      ...data,
    },
    loueurNom: data.loueurNom || data.ownerName || "Loueur",
    ownerSignatureBase64: data.ownerSignature || undefined,
    renterSignatureBase64: data.renterSignature || undefined,
  });

  // 3) Uploader le PDF dans Storage
  const pdfRef = ref(storage, `contracts/${reservationId}.pdf`);
  await uploadBytes(pdfRef, pdfBlob);

  const pdfUrl = await getDownloadURL(pdfRef);

  // 4) Sauvegarder l'URL du contrat dans Firestore
  await updateDoc(reservationRef, {
    contractUrl: pdfUrl,
  });

  return pdfUrl;
}
