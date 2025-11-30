// app/api/reservations/confirm/route.ts

import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendReservationConfirmationToRenter } from "@/lib/email";

/**
 * Confirme une réservation côté loueur :
 * - Passe le statut à "confirmee"
 * - Envoie un email de confirmation au locataire (si email dispo)
 * - Retourne un JSON propre (toujours)
 */
export async function POST(req: Request) {
  try {
    const { reservationId } = await req.json();

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: "reservationId manquant" },
        { status: 400 }
      );
    }

    console.log("✅ [CONFIRM] API appelée avec reservationId:", reservationId);

    const ref = doc(db, "reservations", reservationId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.error("❌ [CONFIRM] Réservation introuvable");
      return NextResponse.json(
        { success: false, error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    const data = snap.data() as any;
    console.log("📄 [CONFIRM] Données réservation:", data);

    // ==========================
    // 1) Mise à jour du statut
    // ==========================
    await updateDoc(ref, {
      status: "confirmee",
      updatedAt: Timestamp.now(),
    });

    // ==========================
    // 2) Récupération infos loueur
    // ==========================
    let ownerEmail: string | null = null;
    let ownerName: string | null = null;

    if (data.loueurId) {
      const ownerSnap = await getDoc(doc(db, "users", data.loueurId));
      if (ownerSnap.exists()) {
        const owner = ownerSnap.data() as any;
        ownerEmail = owner.email || null;
        ownerName = owner.displayName || ownerEmail || "Propriétaire";
      }
    }

    // ==========================
    // 3) Récupération infos locataire
    // ==========================
    let renterEmail: string | null = null;
    let renterName: string = "Client";

    // Cas 1 : locataireId présent → on va chercher dans users
    if (data.locataireId) {
      const renterSnap = await getDoc(doc(db, "users", data.locataireId));
      if (renterSnap.exists()) {
        const renter = renterSnap.data() as any;
        renterEmail = renter.email || null;
        renterName = renter.displayName || renterEmail || renterName;
      }
    }

    // Cas 2 : réservation publique (sans compte) → on utilise les champs de la réservation
    if (!renterEmail && data.locataireEmail) {
      renterEmail = data.locataireEmail;
      renterName = data.locataireNom || renterName;
    }

    // ==========================
    // 4) Infos véhicule
    // ==========================
    let vehicleName = "Véhicule";

    if (data.vehicleMarque && data.vehicleModele) {
      vehicleName = `${data.vehicleMarque} ${data.vehicleModele}`;
    } else if (data.vehicleId) {
      const vehicleSnap = await getDoc(doc(db, "vehicles", data.vehicleId));
      if (vehicleSnap.exists()) {
        const v = vehicleSnap.data() as any;
        if (v.marque && v.modele) {
          vehicleName = `${v.marque} ${v.modele}`;
        } else if (v.name) {
          vehicleName = v.name;
        }
      }
    }

    // ==========================
    // 5) Dates & montant
    // ==========================
    const startTs =
      data.dateDebut?.toDate?.() ?? data.startDate?.toDate?.() ?? null;

    const endTs = data.dateFin?.toDate?.() ?? data.endDate?.toDate?.() ?? null;

    const startDateStr = startTs ? startTs.toLocaleDateString("fr-FR") : "";

    const endDateStr = endTs ? endTs.toLocaleDateString("fr-FR") : "";

    const totalPrice: number = data.prixTotal ?? data.totalPrice ?? 0;

    // ==========================
    // 6) Envoi email locataire
    // ==========================
    if (renterEmail) {
      console.log("📧 [CONFIRM] Envoi email au locataire:", renterEmail);

      await sendReservationConfirmationToRenter({
        renterEmail,
        renterName,
        ownerName: ownerName || "Propriétaire",
        vehicleName,
        startDate: startDateStr,
        endDate: endDateStr,
        totalPrice,
        reservationId,
      });

      console.log("✅ [CONFIRM] Email locataire envoyé");
    } else {
      console.warn(
        "⚠️ [CONFIRM] Aucun email locataire disponible → pas d'envoi d'email"
      );
    }

    // ==========================
    // 7) Réponse JSON OK
    // ==========================
    return NextResponse.json({
      success: true,
      message: "Réservation confirmée",
      debug: {
        reservationId,
        ownerEmail,
        renterEmail,
        vehicleName,
        startDateStr,
        endDateStr,
        totalPrice,
      },
    });
  } catch (error) {
    console.error("❌ [CONFIRM] Erreur API confirmation:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message ?? String(error),
      },
      { status: 500 }
    );
  }
}
