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
      locataireId, // ✅ UID Firebase user connecté
      renterTmpId, // ✅ GARDE pour rétro-compatibilité
      renterName,
      nom, // ✅ NOUVEAU - Nom de famille
      prenom, // ✅ NOUVEAU - Prénom
      renterEmail,
      renterPhone,
      startDate,
      endDate,
      nbDays,
      totalPrice,
      vehicleName,
      vehiclePhoto,
    } = body;

    // ✅ Prioriser locataireId si présent, sinon renterTmpId
    const finalLocataireId = locataireId || renterTmpId;

    // 🚨 SÉCURITÉ - Bloquer si pas de locataireId
    if (!finalLocataireId) {
      console.error(
        "🚨 SÉCURITÉ : Tentative réservation sans locataireId - BLOQUÉ"
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Vous devez être connecté pour réserver. Veuillez vous connecter et réessayer.",
        },
        { status: 401 }
      );
    }

    console.log("✅ locataireId vérifié:", finalLocataireId);

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
    // 2.5) CHARGER LE LOCATAIRE (Documents KYC)
    // ============================
    let locataireData: any = null;
    let locataireDocuments: any = null;

    if (finalLocataireId) {
      try {
        console.log("📄 Chargement locataire:", finalLocataireId);
        const locataireRef = doc(db, "users", finalLocataireId);
        const locataireSnap = await getDoc(locataireRef);

        if (locataireSnap.exists()) {
          locataireData = locataireSnap.data();
          console.log("📄 Data locataire:", locataireData);

          // Récupérer les documents KYC
          locataireDocuments = {
            cin: locataireData.cin || null,
            cinRecto: locataireData.cinRecto || null,
            cinVerso: locataireData.cinVerso || null,
            permis: locataireData.permis || null,
            permisRecto: locataireData.permisRecto || null,
            permisVerso: locataireData.permisVerso || null,
            kycStatus: locataireData.kycStatus || "non_verifie",
            kycVerifiedAt: locataireData.kycVerifiedAt || null,
          };

          console.log("✅ Documents KYC récupérés:", locataireDocuments);
        } else {
          console.warn("⚠️ Locataire introuvable dans Firestore");
        }
      } catch (error) {
        console.error("⚠️ Erreur récupération locataire:", error);
        // On continue même si erreur (non bloquant)
      }
    }

    // ============================
    // 3) VÉRIFIER LE DOUBLE-BOOKING
    // ============================
    const reservationsRef = collection(db, "reservations");
    const q = query(
      reservationsRef,
      where("vehicleId", "==", vehicleId),
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
      // Locataire (UID Firebase ou tmpId)
      locataireId: finalLocataireId,
      renterTmpId: renterTmpId || finalLocataireId,
      locataireNom: renterName,
      nom: nom || "", // ✅ NOUVEAU - Nom de famille pour PDF
      prenom: prenom || "", // ✅ NOUVEAU - Prénom pour PDF
      locataireEmail: renterEmail,
      locatairePhone: renterPhone,
      renterName,
      renterEmail,
      renterPhone,
      // 🆕 DOCUMENTS KYC (si disponibles)
      locataireDocuments: locataireDocuments || null,
      // Infos véhicule
      vehicleName: vehicleName || "Véhicule",
      vehiclePhoto: vehiclePhoto || null,
      // Dates (double naming pour compatibilité)
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
