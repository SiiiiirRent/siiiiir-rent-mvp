// lib/reservations.ts

import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

import {
  sendNewReservationEmailToOwner,
  sendReservationConfirmationToRenter,
  sendReservationCanceledByRenterEmail,
  sendReservationCanceledByOwnerEmail,
} from "./email";

/**
 * Statuts "officiels" utilisés dans l'app
 * (en FR pour être aligné avec ton UI)
 */
export type ReservationStatus =
  | "en_attente"
  | "confirmee"
  | "en_cours"
  | "terminee"
  | "annulee";

/**
 * Entrée générique pour créer une réservation côté code (hors API publique).
 * On garde les anciens champs obligatoires, tout le reste est optionnel
 * pour ne rien casser dans ton code existant.
 */
export interface CreateReservationInput {
  vehicleId: string;
  loueurId: string;
  userId: string; // UID Firebase du locataire (scénario avec compte)
  startDate: Date;
  endDate: Date;

  // Champs optionnels (nouvelle génération PRO)
  totalPrice?: number;
  nbDays?: number;
  renterName?: string;
  renterEmail?: string;
  renterPhone?: string;
  vehicleName?: string;
  vehiclePhoto?: string | null;
}

/**
 * Helper interne : récupère une date JS à partir d'un champ Firestore
 * qui peut s'appeler startDate / dateDebut ou endDate / dateFin.
 */
function extractDate(field: any): Date | null {
  if (!field) return null;
  if (field.toDate && typeof field.toDate === "function") {
    const d = field.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(field);
  return isNaN(d.getTime()) ? null : d;
}

//
// ==========================================
// 1) CRÉATION SANS DOUBLE BOOKING (version PRO)
// ==========================================
//
export async function createReservationWithoutDoubleBooking(
  input: CreateReservationInput
) {
  const {
    vehicleId,
    loueurId,
    userId,
    startDate,
    endDate,
    totalPrice,
    nbDays,
    renterName,
    renterEmail,
    renterPhone,
    vehicleName,
    vehiclePhoto,
  } = input;

  if (startDate >= endDate) {
    throw new Error("Les dates de réservation sont invalides.");
  }

  const reservationsRef = collection(db, "reservations");

  // 1️⃣ Vérification des chevauchements
  const q = query(
    reservationsRef,
    where("vehicleId", "==", vehicleId),
    where("status", "in", ["en_attente", "confirmee"])
  );

  const existing = await getDocs(q);

  for (const docSnap of existing.docs) {
    const data = docSnap.data() as any;

    const existingStart =
      extractDate(data.startDate) || extractDate(data.dateDebut);
    const existingEnd = extractDate(data.endDate) || extractDate(data.dateFin);

    if (!existingStart || !existingEnd) continue;

    if (existingStart <= endDate && existingEnd >= startDate) {
      throw new Error("Ce véhicule est déjà réservé sur ces dates.");
    }
  }

  // 2️⃣ Charger les infos loueur + locataire + véhicule
  const [ownerSnap, renterSnap, vehicleSnap] = await Promise.all([
    getDoc(doc(db, "users", loueurId)),
    getDoc(doc(db, "users", userId)),
    getDoc(doc(db, "vehicles", vehicleId)),
  ]);

  if (!ownerSnap.exists()) {
    throw new Error("Loueur introuvable.");
  }

  const owner = ownerSnap.data() as any;
  const renter = renterSnap.exists() ? (renterSnap.data() as any) : null;
  const vehicle = vehicleSnap.exists() ? (vehicleSnap.data() as any) : null;

  const finalRenterName =
    renterName || renter?.displayName || renter?.fullName || "Locataire";
  const finalRenterEmail = renterEmail || renter?.email || null;

  const finalVehicleName =
    vehicleName ||
    (vehicle
      ? vehicle.marque
        ? `${vehicle.marque} ${vehicle.modele ?? ""}`.trim()
        : (vehicle.name ?? "Véhicule")
      : "Véhicule");

  const finalVehiclePhoto =
    vehiclePhoto || (vehicle?.photos && vehicle.photos[0]) || null;

  const startTs = Timestamp.fromDate(startDate);
  const endTs = Timestamp.fromDate(endDate);

  const nbJours =
    typeof nbDays === "number" && nbDays > 0
      ? nbDays
      : Math.max(
          1,
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1
        );

  const prixTotal =
    typeof totalPrice === "number" && totalPrice >= 0
      ? totalPrice
      : (vehicle?.prix ?? 0) * nbJours;

  // 3️⃣ Création Firestore (structure alignée avec l'API publique)
  const reservationRef = await addDoc(reservationsRef, {
    loueurId,
    vehicleId,
    locataireId: userId,
    renterName: finalRenterName,
    renterEmail: finalRenterEmail,
    renterPhone: renterPhone || null,
    vehicleName: finalVehicleName,
    vehiclePhoto: finalVehiclePhoto,
    // dates (double naming)
    startDate: startTs,
    endDate: endTs,
    dateDebut: startTs,
    dateFin: endTs,
    nbJours,
    totalPrice: prixTotal,
    prixTotal,
    ownerEmail: owner.email || null,
    ownerName: owner.displayName || owner.fullName || "Propriétaire",
    status: "en_attente",
    paymentStatus: "non_paye",
    createdAt: Timestamp.now(),
  });

  const reservationId = reservationRef.id;

  // 4️⃣ Emails (idem API publique)
  const startStr = startDate.toLocaleDateString("fr-FR");
  const endStr = endDate.toLocaleDateString("fr-FR");

  if (owner.email) {
    await sendNewReservationEmailToOwner({
      ownerEmail: owner.email,
      ownerName: owner.displayName || "Propriétaire",
      renterName: finalRenterName,
      vehicleName: finalVehicleName,
      startDate: startStr,
      endDate: endStr,
      totalPrice: prixTotal,
      reservationId,
    });
  }

  if (finalRenterEmail) {
    await sendReservationConfirmationToRenter({
      renterEmail: finalRenterEmail,
      renterName: finalRenterName,
      ownerName: owner.displayName || "Propriétaire",
      vehicleName: finalVehicleName,
      startDate: startStr,
      endDate: endStr,
      totalPrice: prixTotal,
      reservationId,
    });
  }

  return { success: true, reservationId };
}

//
// ======================================================
// 2) CONFIRMATION PAR LE LOUEUR (avec email)
// ======================================================
//
export async function confirmReservationAndSendEmails(reservationId: string) {
  const refReservation = doc(db, "reservations", reservationId);
  const snap = await getDoc(refReservation);

  if (!snap.exists()) throw new Error("Réservation introuvable.");

  const data = snap.data() as any;

  // 1️⃣ Mise à jour du statut
  await updateDoc(refReservation, {
    status: "confirmee",
    updatedAt: Timestamp.now(),
  });

  // 2️⃣ Récupérer les infos détaillées
  const [ownerSnap, renterSnap, vehicleSnap] = await Promise.all([
    getDoc(doc(db, "users", data.loueurId)),
    data.locataireId ? getDoc(doc(db, "users", data.locataireId)) : null,
    data.vehicleId ? getDoc(doc(db, "vehicles", data.vehicleId)) : null,
  ]);

  const owner = ownerSnap.exists()
    ? (ownerSnap.data() as any)
    : {
        email: data.ownerEmail,
        displayName: data.ownerName ?? "Propriétaire",
      };

  const renter =
    renterSnap && renterSnap.exists()
      ? (renterSnap.data() as any)
      : {
          email: data.renterEmail || data.locataireEmail,
          displayName: data.renterName || data.locataireNom || "Locataire",
        };

  const vehicle =
    vehicleSnap && vehicleSnap.exists()
      ? (vehicleSnap.data() as any)
      : {
          marque: undefined,
          modele: undefined,
          name: data.vehicleName ?? "Véhicule",
        };

  const start = extractDate(data.startDate) || extractDate(data.dateDebut);
  const end = extractDate(data.endDate) || extractDate(data.dateFin);

  const startStr = start ? start.toLocaleDateString("fr-FR") : "Date de début";
  const endStr = end ? end.toLocaleDateString("fr-FR") : "Date de fin";

  const price = data.prixTotal ?? data.totalPrice ?? 0;

  const vehicleLabel = vehicle.marque
    ? `${vehicle.marque} ${vehicle.modele ?? ""}`.trim()
    : (vehicle.name ?? "Véhicule");

  await Promise.all([
    // Email au loueur (peut être un rappel "réservation confirmée")
    owner.email &&
      sendNewReservationEmailToOwner({
        ownerEmail: owner.email,
        ownerName: owner.displayName ?? "Propriétaire",
        renterName: renter.displayName ?? renter.email ?? "Locataire",
        vehicleName: vehicleLabel,
        startDate: startStr,
        endDate: endStr,
        totalPrice: price,
        reservationId,
      }),

    // Email au locataire (confirmation finale)
    renter.email &&
      sendReservationConfirmationToRenter({
        renterEmail: renter.email,
        renterName: renter.displayName ?? renter.email ?? "Vous",
        ownerName: owner.displayName ?? owner.email ?? "Propriétaire",
        vehicleName: vehicleLabel,
        startDate: startStr,
        endDate: endStr,
        totalPrice: price,
        reservationId,
      }),
  ]);
}

//
// ======================================================
// 3) ANNULATION PAR LE LOCATAIRE → EMAIL AU LOUEUR
// ⚠️ CETTE FONCTION NE DOIT ÊTRE APPELÉE QUE DEPUIS UNE API ROUTE
// ======================================================
//
export async function cancelReservationByRenter(reservationId: string) {
  const refReservation = doc(db, "reservations", reservationId);
  const snap = await getDoc(refReservation);

  if (!snap.exists()) throw new Error("Réservation introuvable.");

  const data = snap.data() as any;

  // UPDATE
  await updateDoc(refReservation, {
    status: "annulee",
    cancelledBy: "locataire",
    cancelledAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const ownerEmail = data.ownerEmail;
  const ownerName = data.ownerName ?? "Propriétaire";
  const renterName = data.renterName || data.locataireNom || "Locataire";
  const renterEmail = data.renterEmail || data.locataireEmail;

  const vehicleName = data.vehicleName || "Véhicule";

  const startDate = extractDate(data.startDate) || extractDate(data.dateDebut);
  const endDate = extractDate(data.endDate) || extractDate(data.dateFin);

  return await sendReservationCanceledByRenterEmail({
    ownerEmail: ownerEmail,
    ownerName,
    renterName,
    renterEmail,
    reservationId,
    vehicleName,
    startDate: startDate ? startDate.toLocaleDateString("fr-FR") : undefined,
    endDate: endDate ? endDate.toLocaleDateString("fr-FR") : undefined,
  });
}

//
// ======================================================
// 4) ANNULATION PAR LE LOUEUR → EMAIL AU LOCATAIRE
// ⚠️ CETTE FONCTION NE DOIT ÊTRE APPELÉE QUE DEPUIS UNE API ROUTE
// ======================================================
//
export async function cancelReservationByOwner(reservationId: string) {
  const refReservation = doc(db, "reservations", reservationId);
  const snap = await getDoc(refReservation);

  if (!snap.exists()) throw new Error("Réservation introuvable.");

  const data = snap.data() as any;

  // UPDATE
  await updateDoc(refReservation, {
    status: "annulee",
    cancelledBy: "proprietaire",
    cancelledAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const renterName = data.renterName || data.locataireNom || "Locataire";
  const renterEmail = data.renterEmail || data.locataireEmail;
  const ownerName = data.ownerName || "Propriétaire";
  const vehicleName = data.vehicleName || "Véhicule";

  const startDate = extractDate(data.startDate) || extractDate(data.dateDebut);
  const endDate = extractDate(data.endDate) || extractDate(data.dateFin);

  return await sendReservationCanceledByOwnerEmail({
    renterEmail,
    renterName,
    ownerName,
    reservationId,
    vehicleName,
    startDate: startDate ? startDate.toLocaleDateString("fr-FR") : undefined,
    endDate: endDate ? endDate.toLocaleDateString("fr-FR") : undefined,
  });
}

//
// ======================================================
// 5) FULL FLOW SIMPLE → CONFIRMATION + REDIRECTION
// (PAS DE PDF, PAS DE STORAGE, JUSTE POUR TON FRONT)
// ======================================================
//
export async function confirmReservationFullFlow(reservationId: string) {
  const refReservation = doc(db, "reservations", reservationId);
  const snap = await getDoc(refReservation);

  if (!snap.exists()) throw new Error("Réservation introuvable.");

  // On met juste le statut à "confirmee"
  await updateDoc(refReservation, {
    status: "confirmee",
    updatedAt: Timestamp.now(),
  });

  // On renvoie un objet compatible avec ton front
  return {
    success: true,
    nextStep: `/dashboard/reservations/${reservationId}`,
    contractUrl: null,
  };
}
//
// ======================================================
// 6) ENVOYER EMAIL ANNULATION LOUEUR (SANS TOUCHER FIRESTORE)
// ⚠️ CETTE FONCTION EST APPELÉE DEPUIS L'API ROUTE UNIQUEMENT
// ======================================================
//
export async function sendCancelEmailToRenter(reservationId: string) {
  console.log("📧 Envoi email annulation loueur → ID:", reservationId);

  const refReservation = doc(db, "reservations", reservationId);
  const snap = await getDoc(refReservation);

  if (!snap.exists()) {
    throw new Error("Réservation introuvable.");
  }

  const data = snap.data() as any;

  let renterName = data.renterName || data.locataireNom || "Locataire";
  let renterEmail = data.renterEmail || data.locataireEmail;

  // ✅ Si renterEmail manquant, cherche dans users
  if (!renterEmail && data.locataireId) {
    console.log("⚠️ renterEmail manquant, recherche dans users...");
    try {
      const renterDoc = await getDoc(doc(db, "users", data.locataireId));
      if (renterDoc.exists()) {
        const renterData = renterDoc.data();
        renterEmail = renterData.email || renterData.mail;

        if (!renterName || renterName === "Locataire") {
          renterName =
            renterData.displayName ||
            `${renterData.prenom || ""} ${renterData.nom || ""}`.trim() ||
            "Locataire";
        }

        console.log("✅ Données locataire trouvées:", {
          renterEmail,
          renterName,
        });
      }
    } catch (error) {
      console.error("❌ Erreur récupération données locataire:", error);
    }
  }

  const ownerName = data.ownerName || "Propriétaire";
  const vehicleName = data.vehicleName || "Véhicule";

  const startDate = extractDate(data.startDate) || extractDate(data.dateDebut);
  const endDate = extractDate(data.endDate) || extractDate(data.dateFin);

  console.log("📧 Préparation email annulation loueur →", {
    renterEmail,
    renterName,
    ownerName,
    vehicleName,
  });

  // ✅ Envoie email seulement si renterEmail existe
  if (renterEmail) {
    await sendReservationCanceledByOwnerEmail({
      renterEmail,
      renterName,
      ownerName,
      reservationId,
      vehicleName,
      startDate: startDate ? startDate.toLocaleDateString("fr-FR") : undefined,
      endDate: endDate ? endDate.toLocaleDateString("fr-FR") : undefined,
    });
    console.log("✅ Email envoyé à", renterEmail);
    return { success: true, emailSent: true };
  } else {
    console.error("❌ IMPOSSIBLE DE TROUVER renterEmail - Email non envoyé");
    return { success: false, emailSent: false };
  }
}
//
// ======================================================
// 7) ENVOYER EMAIL ANNULATION LOCATAIRE (SANS TOUCHER FIRESTORE)
// ⚠️ CETTE FONCTION EST APPELÉE DEPUIS L'API ROUTE UNIQUEMENT
// ======================================================
//
export async function sendCancelEmailToOwner(reservationId: string) {
  console.log("📧 Envoi email annulation locataire → ID:", reservationId);

  const refReservation = doc(db, "reservations", reservationId);
  const snap = await getDoc(refReservation);

  if (!snap.exists()) {
    throw new Error("Réservation introuvable.");
  }

  const data = snap.data() as any;

  let ownerEmail = data.ownerEmail;
  let ownerName = data.ownerName || "Propriétaire";

  // ✅ Si ownerEmail manquant, cherche dans users
  if (!ownerEmail && data.loueurId) {
    console.log("⚠️ ownerEmail manquant, recherche dans users...");
    try {
      const ownerDoc = await getDoc(doc(db, "users", data.loueurId));
      if (ownerDoc.exists()) {
        const ownerData = ownerDoc.data();
        ownerEmail = ownerData.email || ownerData.mail;

        if (!ownerName || ownerName === "Propriétaire") {
          ownerName =
            ownerData.displayName ||
            `${ownerData.prenom || ""} ${ownerData.nom || ""}`.trim() ||
            "Propriétaire";
        }

        console.log("✅ Données loueur trouvées:", { ownerEmail, ownerName });
      }
    } catch (error) {
      console.error("❌ Erreur récupération données loueur:", error);
    }
  }

  const renterName = data.renterName || data.locataireNom || "Locataire";
  const renterEmail = data.renterEmail || data.locataireEmail;
  const vehicleName = data.vehicleName || "Véhicule";

  const startDate = extractDate(data.startDate) || extractDate(data.dateDebut);
  const endDate = extractDate(data.endDate) || extractDate(data.dateFin);

  console.log("📧 Préparation email annulation locataire →", {
    ownerEmail,
    ownerName,
    renterName,
    renterEmail,
    vehicleName,
  });

  // ✅ Envoie email seulement si ownerEmail existe
  if (ownerEmail) {
    await sendReservationCanceledByRenterEmail({
      ownerEmail,
      ownerName,
      renterName,
      renterEmail,
      reservationId,
      vehicleName,
      startDate: startDate ? startDate.toLocaleDateString("fr-FR") : undefined,
      endDate: endDate ? endDate.toLocaleDateString("fr-FR") : undefined,
    });
    console.log("✅ Email envoyé à", ownerEmail);
    return { success: true, emailSent: true };
  } else {
    console.error("❌ IMPOSSIBLE DE TROUVER ownerEmail - Email non envoyé");
    return { success: false, emailSent: false };
  }
}
