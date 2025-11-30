import { NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  sendNewReservationEmailToOwner,
  sendReservationConfirmationToRenter,
} from "@/lib/email";

// Petit helper pour parser les dates envoyées depuis le front
function parseDate(value: any): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📩 [API] /api/reservations/create → body reçu:", body);

    const {
      loueurId,
      vehicleId,
      renterTmpId,
      renterName,
      renterEmail,
      renterPhone,
      startDate,
      endDate,
      nbDays,
      totalPrice,
      vehicleName,
      vehiclePhoto,
    } = body;

    // ============================
    // 1) VALIDATION DE BASE
    // ============================
    if (!loueurId || !vehicleId) {
      return NextResponse.json(
        { success: false, error: "loueurId et vehicleId sont obligatoires" },
        { status: 400 }
      );
    }

    if (!renterName || !renterEmail || !renterPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "Nom, email et téléphone du locataire sont obligatoires",
        },
        { status: 400 }
      );
    }

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!start || !end) {
      return NextResponse.json(
        { success: false, error: "Dates invalides" },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        {
          success: false,
          error: "La date de fin doit être après la date de début",
        },
        { status: 400 }
      );
    }

    const nbJours = typeof nbDays === "number" && nbDays > 0 ? nbDays : 1;
    const prixTotal =
      typeof totalPrice === "number" && totalPrice >= 0 ? totalPrice : 0;

    // ============================
    // 2) CHARGER LE LOUEUR
    // ============================
    const loueurRef = doc(db, "users", loueurId);
    const loueurSnap = await getDoc(loueurRef);

    if (!loueurSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Loueur introuvable" },
        { status: 404 }
      );
    }

    const loueur = loueurSnap.data() as any;
    const ownerEmail: string = loueur.email || "";
    const ownerName: string =
      loueur.displayName || loueur.fullName || "Propriétaire";

    // ============================
    // 3) VÉRIFIER LE DOUBLE-BOOKING
    // ============================
    const reservationsRef = collection(db, "reservations");
    const q = query(
      reservationsRef,
      where("vehicleId", "==", vehicleId),
      // on couvre les 2 conventions que tu utilises
      where("status", "in", ["en_attente", "confirmee"])
    );

    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const r = docSnap.data() as any;
      const existingStartTs = r.dateDebut || r.startDate;
      const existingEndTs = r.dateFin || r.endDate;

      if (!existingStartTs || !existingEndTs) continue;

      const existingStart = existingStartTs.toDate();
      const existingEnd = existingEndTs.toDate();

      // Chevauchement ?
      if (existingStart <= end && existingEnd >= start) {
        console.log(
          "⛔ Chevauchement avec réservation:",
          docSnap.id,
          existingStart,
          existingEnd
        );
        return NextResponse.json(
          {
            success: false,
            error:
              "Ce véhicule est déjà réservé sur ces dates. Merci de choisir d'autres dates.",
          },
          { status: 409 }
        );
      }
    }

    // ============================
    // 4) ENREGISTRER LA RÉSERVATION
    // ============================
    const startTs = Timestamp.fromDate(start);
    const endTs = Timestamp.fromDate(end);

    const reservationData = {
      loueurId,
      vehicleId,
      // locataire "temporaire" (pas encore de compte)
      locataireId: renterTmpId,
      renterTmpId,
      locataireNom: renterName,
      locataireEmail: renterEmail,
      locatairePhone: renterPhone,
      renterName,
      renterEmail,
      renterPhone,
      // Infos véhicule
      vehicleName: vehicleName || "Véhicule",
      vehiclePhoto: vehiclePhoto || null,
      // Dates (double naming pour compatibilité avec ton ancien code)
      startDate: startTs,
      endDate: endTs,
      dateDebut: startTs,
      dateFin: endTs,
      nbJours,
      totalPrice: prixTotal,
      prixTotal: prixTotal,
      // Infos loueur
      ownerEmail,
      ownerName,
      // Statuts
      status: "en_attente",
      paymentStatus: "non_paye",
      createdAt: Timestamp.now(),
    };

    const reservationRef = await addDoc(reservationsRef, reservationData);
    const reservationId = reservationRef.id;

    console.log("✅ Réservation créée:", reservationId, reservationData);

    // ============================
    // 5) ENVOI DES EMAILS
    // ============================

    const startStr = start.toLocaleDateString("fr-FR");
    const endStr = end.toLocaleDateString("fr-FR");

    // Email au loueur
    if (ownerEmail) {
      await sendNewReservationEmailToOwner({
        ownerEmail,
        ownerName,
        renterName,
        vehicleName: reservationData.vehicleName,
        startDate: startStr,
        endDate: endStr,
        totalPrice: prixTotal,
        reservationId,
      });
    }

    // Email au locataire
    if (renterEmail) {
      await sendReservationConfirmationToRenter({
        renterEmail,
        renterName,
        ownerName,
        vehicleName: reservationData.vehicleName,
        startDate: startStr,
        endDate: endStr,
        totalPrice: prixTotal,
        reservationId,
      });
    }

    console.log("📧 Emails envoyés pour la réservation", reservationId);

    // ============================
    // 6) RÉPONSE OK
    // ============================
    return NextResponse.json({
      success: true,
      reservationId,
    });
  } catch (error) {
    console.error("❌ ERREUR /api/reservations/create :", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
