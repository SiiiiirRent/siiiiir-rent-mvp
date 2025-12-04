// lib/checkinout.ts
import { db, storage } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Reservation,
  CheckInData,
  CheckOutData,
  CheckPhoto,
  PhotoType,
} from "@/lib/types";

/* ============================================================
    🟢 (1) COMPRESSION BASE64 → JPEG (signature + performance)
=============================================================== */
async function dataUrlToCompressedJpegBlob(
  dataUrl: string,
  maxWidth = 800,
  quality = 0.7
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const ratio = img.width / img.height;
      const width = Math.min(img.width, maxWidth);
      const height = width / ratio;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas error"));

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("JPEG compression failed"));
          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = reject;
    img.src = dataUrl;
  });
}

/* ============================================================
    🟢 (2) UPLOAD SIGNATURE — VERSION OPTIMISÉE
=============================================================== */
async function uploadSignatureToStorage(
  reservationId: string,
  signatureBase64: string,
  checkType: "checkin" | "checkout",
  signerRole: "locataire" | "loueur"
): Promise<string> {
  console.log(`🔄 Upload signature ${signerRole} compressée...`);

  const blob = await dataUrlToCompressedJpegBlob(signatureBase64, 800, 0.7);

  const timestamp = Date.now();
  const fileName = `signature_${signerRole}_${timestamp}.jpg`;
  const path = `signatures/${reservationId}/${checkType}/${fileName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, {
    customMetadata: { reservationId, checkType, signerRole },
  });

  return await getDownloadURL(storageRef);
}

/* ============================================================
    🟢 (3) UPLOAD PHOTO CHECK-IN / CHECK-OUT
=============================================================== */
export async function uploadCheckPhoto(
  reservationId: string,
  file: File,
  photoType: PhotoType,
  checkType: "checkin" | "checkout",
  userId: string
): Promise<CheckPhoto> {
  const timestamp = Date.now();
  const fileName = `${checkType}_${photoType}_${timestamp}.jpg`;
  const storagePath = `reservations/${reservationId}/${checkType}/${fileName}`;

  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    customMetadata: { reservationId, userId, photoType, checkType },
  });

  const url = await getDownloadURL(storageRef);

  return {
    type: photoType,
    url,
    uploadedAt: Timestamp.now(),
    uploadedBy: userId,
  };
}

/* ============================================================
    🟢 (4) SAVE CHECK-IN (Locataire) - VERSION CORRIGÉE ✅
=============================================================== */
export async function saveCheckin(
  reservationId: string,
  data: {
    photos: CheckPhoto[];
    kilometrage: number;
    carburant: string;
    notes?: string;
    signatureLocataire: string;
  },
  userId: string
): Promise<void> {
  const refDoc = doc(db, "reservations", reservationId);

  try {
    // ✅ CORRECTION : Sauvegarder la signature en base64 directement
    // (comme pour fastValidateCheckin)
    const checkinData: Partial<CheckInData> = {
      photos: data.photos,
      kilometrage: data.kilometrage,
      carburant: data.carburant as CheckInData["carburant"],
      notes: data.notes,
      signatureLocataire: data.signatureLocataire, // ✅ Base64 direct (pas d'upload)
      createdAt: serverTimestamp(),
      createdBy: userId,
    };

    await updateDoc(refDoc, {
      checkin: checkinData,
      checkStatus: "checkin_en_attente_validation",
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Check-in sauvegardé (signature en base64)");
  } catch (error) {
    console.error("❌ Erreur check-in:", error);
    throw error;
  }
}

/* ============================================================
    🟢 (5) VALIDATION CHECK-IN — LOURD (ancienne version)
    ⚠️ Ne plus utiliser avec OPTION A
=============================================================== */
export async function validateCheckin(
  reservationId: string,
  signatureLoueur: string,
  userId: string,
  pdfUrl: string
): Promise<void> {
  const refDoc = doc(db, "reservations", reservationId);

  const signatureUrl = await uploadSignatureToStorage(
    reservationId,
    signatureLoueur,
    "checkin",
    "loueur"
  );

  await updateDoc(refDoc, {
    "checkin.validatedAt": serverTimestamp(),
    "checkin.validatedBy": userId,
    "checkin.signatureLoueur": signatureUrl,
    "checkin.pdfUrl": pdfUrl,
    checkStatus: "en_cours",
    updatedAt: serverTimestamp(),
  });
}

/* ============================================================
    🟢 (6) FAST VALIDATE CHECK-IN — OPTION A (🏆)
    ⚡ VALIDATION INSTANTANÉE (0.3 sec)
=============================================================== */
export async function fastValidateCheckin(
  reservationId: string,
  loueurId: string,
  signatureBase64: string
) {
  const refDoc = doc(db, "reservations", reservationId);

  // pas d'upload PDF ici → léger
  // pas de génération PDF ici → léger
  // upload signature NON compressée ici volontairement → rapide

  await updateDoc(refDoc, {
    "checkin.validatedAt": serverTimestamp(),
    "checkin.validatedBy": loueurId,
    "checkin.signatureLoueur": signatureBase64,
    checkStatus: "en_cours",
    updatedAt: serverTimestamp(),
  });
}

/* ============================================================
    🟢 (7) SAVE CHECK-OUT - VERSION CORRIGÉE ✅
=============================================================== */
export async function saveCheckout(
  reservationId: string,
  data: {
    photos: CheckPhoto[];
    kilometrage: number;
    carburant: string;
    notes?: string;
    signatureLocataire: string;
  },
  userId: string
): Promise<void> {
  const refDoc = doc(db, "reservations", reservationId);

  try {
    // ✅ CORRECTION : Sauvegarder la signature en base64 directement
    // (comme pour fastValidateCheckin)
    const checkoutData: Partial<CheckOutData> = {
      photos: data.photos,
      kilometrage: data.kilometrage,
      carburant: data.carburant as CheckOutData["carburant"],
      notes: data.notes,
      signatureLocataire: data.signatureLocataire, // ✅ Base64 direct (pas d'upload)
      createdAt: serverTimestamp(),
      createdBy: userId,
    };

    await updateDoc(refDoc, {
      checkout: checkoutData,
      checkStatus: "checkout_en_attente_validation",
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Check-out sauvegardé (signature en base64)");
  } catch (error) {
    console.error("❌ Erreur check-out:", error);
    throw error;
  }
}

/* ============================================================
    🟢 (8) VALIDATION CHECK-OUT
=============================================================== */
export async function validateCheckout(
  reservationId: string,
  signatureLoueur: string,
  userId: string,
  pdfUrl: string
): Promise<void> {
  const refDoc = doc(db, "reservations", reservationId);

  const signatureUrl = await uploadSignatureToStorage(
    reservationId,
    signatureLoueur,
    "checkout",
    "loueur"
  );

  await updateDoc(refDoc, {
    "checkout.validatedAt": serverTimestamp(),
    "checkout.validatedBy": userId,
    "checkout.signatureLoueur": signatureUrl,
    "checkout.pdfUrl": pdfUrl,
    checkStatus: "terminee",
    updatedAt: serverTimestamp(),
  });
}

/* ============================================================
    🟢 (9) DÉCLARATION LITIGE
=============================================================== */
export async function declareCheckoutLitige(
  reservationId: string,
  data: {
    reason: string;
    photosSupplementaires?: string[];
    montantReclame?: number;
  },
  userId: string
) {
  const refDoc = doc(db, "reservations", reservationId);

  await updateDoc(refDoc, {
    "checkout.litige": {
      declared: true,
      reason: data.reason,
      photosSupplementaires: data.photosSupplementaires || [],
      montantReclame: data.montantReclame || 0,
      declaredAt: serverTimestamp(),
      declaredBy: userId,
    },
    checkStatus: "litige",
    updatedAt: serverTimestamp(),
  });
}

/* ============================================================
    🟢 (10) GET RESERVATION
=============================================================== */
export async function getReservationForCheck(
  reservationId: string
): Promise<Reservation | null> {
  const refDoc = doc(db, "reservations", reservationId);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) return null;

  return { id: snap.id, ...snap.data() } as Reservation;
}

/* ============================================================
    🟢 (11) UPLOAD PDF
=============================================================== */
export async function uploadCheckPDF(
  reservationId: string,
  pdfBlob: Blob,
  type: "checkin" | "checkout"
) {
  const timestamp = Date.now();
  const fileName = `${type}_${timestamp}.pdf`;
  const path = `reservations/${reservationId}/documents/${fileName}`;

  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, pdfBlob);
  return await getDownloadURL(storageRef);
}
