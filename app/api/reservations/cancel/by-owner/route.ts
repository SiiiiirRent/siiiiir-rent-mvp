import { NextResponse } from "next/server";
import { sendCancelEmailToRenter } from "@/lib/reservations"; // ← NOUVEAU

export async function POST(req: Request) {
  try {
    const { reservationId } = await req.json();

    console.log("📧 [API] Envoi email annulation loueur →", reservationId);

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: "reservationId manquant" },
        { status: 400 }
      );
    }

    // ✅ Appelle la fonction qui envoie JUSTE l'email (sans toucher Firestore)
    const result = await sendCancelEmailToRenter(reservationId);

    if (result.emailSent) {
      console.log("✅ Email annulation envoyé au locataire");
      return NextResponse.json({
        success: true,
        message: "Email envoyé avec succès",
      });
    } else {
      console.warn("⚠️ Email non envoyé (renterEmail manquant)");
      return NextResponse.json({
        success: false,
        message: "Email non envoyé (renterEmail manquant)",
      });
    }
  } catch (error) {
    console.error("❌ ERREUR API email annulation loueur:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
