import { NextRequest, NextResponse } from "next/server";
import {
  sendNewReservationEmailToOwner,
  sendReservationConfirmationToRenter,
  sendPaymentConfirmationEmail,
  sendReminderEmail,
  sendReservationCanceledByRenterEmail,
  sendCheckinValidatedEmail,
  sendCheckoutValidatedEmail,
  sendLitigeDeclareeEmail,
} from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...params } = body;

    let result;

    switch (type) {
      case "new_reservation_owner":
        result = await sendNewReservationEmailToOwner(params);
        break;

      case "reservation_confirmation_renter":
        result = await sendReservationConfirmationToRenter(params);
        break;

      case "payment_confirmation":
        result = await sendPaymentConfirmationEmail(params);
        break;

      case "reminder":
        result = await sendReminderEmail(params);
        break;

      case "reservation_canceled_by_renter": {
        console.log("📧 Annulation - params reçus:", params);

        // ✅ On utilise directement l'email passé depuis le front-end
        result = await sendReservationCanceledByRenterEmail({
          ownerEmail: params.ownerEmail,
          ownerName: params.ownerName,
          renterName: params.renterName,
          renterEmail: params.renterEmail,
          reservationId: params.reservationId,
          vehicleName: params.vehicleName,
          startDate: params.startDate,
          endDate: params.endDate,
        });
        break;
      }

      case "checkin_validated":
        result = await sendCheckinValidatedEmail(params);
        break;

      case "checkout_validated":
        result = await sendCheckoutValidatedEmail(params);
        break;

      case "litige_declaree":
        result = await sendLitigeDeclareeEmail(params);
        break;

      default:
        return NextResponse.json(
          { error: "Type d'email invalide" },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur API send-email:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
