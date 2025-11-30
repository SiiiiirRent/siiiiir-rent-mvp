import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendReservationCanceledByRenterEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { reservationId } = await req.json();

    console.log("📧 [API] Envoi email annulation →", reservationId);

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: "reservationId manquant" },
        { status: 400 }
      );
    }

    // 1) Charger la réservation
    const ref = doc(db, "reservations", reservationId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    const data = snap.data() as any;

    console.log("📄 Données réservation :", data);

    // 2) Préparer les données email
    let ownerEmail = data.ownerEmail;
    let ownerName = data.ownerName || "Propriétaire";

    // ✅ Si ownerEmail n'existe pas, récupère l'email du loueur depuis users
    if (!ownerEmail && data.loueurId) {
      console.log("⚠️ ownerEmail manquant, recherche dans collection users...");
      try {
        const ownerDoc = await getDoc(doc(db, "users", data.loueurId));
        if (ownerDoc.exists()) {
          const ownerData = ownerDoc.data();
          ownerEmail = ownerData.email || ownerData.mail;

          // Récupère aussi le nom si pas présent
          if (!ownerName || ownerName === "Propriétaire") {
            ownerName =
              ownerData.displayName ||
              `${ownerData.prenom || ""} ${ownerData.nom || ""}`.trim() ||
              "Propriétaire";
          }

          console.log("✅ Données loueur trouvées:", { ownerEmail, ownerName });
        } else {
          console.warn(
            "⚠️ Document users introuvable pour loueurId:",
            data.loueurId
          );
        }
      } catch (error) {
        console.error("❌ Erreur récupération données loueur:", error);
      }
    }

    const renterName = data.renterName || data.locataireNom || "Locataire";
    const renterEmail = data.renterEmail || data.locataireEmail;
    const vehicleName =
      data.vehicleName ||
      (data.vehicleMarque && data.vehicleModele
        ? `${data.vehicleMarque} ${data.vehicleModele}`
        : "Véhicule");

    const startDate = (data.startDate || data.dateDebut)?.toDate
      ? (data.startDate || data.dateDebut).toDate().toLocaleDateString("fr-FR")
      : null;

    const endDate = (data.endDate || data.dateFin)?.toDate
      ? (data.endDate || data.dateFin).toDate().toLocaleDateString("fr-FR")
      : null;

    console.log("📧 Préparation email annulation →", {
      ownerEmail,
      ownerName,
      renterName,
      renterEmail,
      vehicleName,
      startDate,
      endDate,
    });

    // 3) Envoi email loueur
    if (ownerEmail) {
      await sendReservationCanceledByRenterEmail({
        ownerEmail,
        ownerName,
        renterName,
        renterEmail,
        vehicleName,
        startDate,
        endDate,
        reservationId,
      });
      console.log("✅ Email envoyé à", ownerEmail);
    } else {
      console.error("❌ IMPOSSIBLE DE TROUVER ownerEmail - Email non envoyé");
      console.error(
        "   → Vérifie que le document users existe pour loueurId:",
        data.loueurId
      );
    }

    return NextResponse.json({
      success: true,
      message: ownerEmail
        ? "Email envoyé avec succès"
        : "Email non envoyé (ownerEmail manquant)",
    });
  } catch (error) {
    console.error("❌ ERREUR API email annulation:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
