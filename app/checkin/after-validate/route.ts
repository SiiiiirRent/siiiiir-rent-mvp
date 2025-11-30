import { NextResponse } from "next/server";
import { getReservationForCheck, uploadCheckPDF } from "@/lib/checkinout";
import { generateCheckinPDF } from "@/lib/generateCheckInOutPDF";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const { reservationId, loueurName } = await req.json();

    // 1. Récup réservation
    const reservation = await getReservationForCheck(reservationId);
    if (!reservation) return NextResponse.json({ ok: false });

    // 2. Générer PDF
    const pdfBlob = await generateCheckinPDF(reservation, loueurName);

    // 3. Upload PDF
    const pdfUrl = await uploadCheckPDF(reservationId, pdfBlob, "checkin");

    // 4. Mettre à jour Firestore
    await updateDoc(doc(db, "reservations", reservationId), {
      "checkin.pdfUrl": pdfUrl,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Background check-in error:", error);
    return NextResponse.json({ ok: false });
  }
}
