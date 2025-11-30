import jsPDF from "jspdf";
import { Reservation, Payment } from "./types";

interface GenerateReceiptPDFParams {
  reservation: Reservation;
  payment: Payment;
  loueurNom: string;
}

export async function generateReceiptPDF({
  reservation,
  payment,
  loueurNom,
}: GenerateReceiptPDFParams): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Helper: Ajouter du texte
  const addText = (
    text: string,
    x: number,
    y: number,
    size: number = 10,
    style: "normal" | "bold" = "normal"
  ) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(31, 41, 55);
    doc.text(text, x, y);
  };

  // ========== EN-TÊTE ==========
  doc.setFillColor(22, 163, 74); // green-600
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SIIIIIR RENT", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("REÇU DE PAIEMENT", pageWidth / 2, 32, { align: "center" });

  yPosition = 55;

  // ========== NUMÉRO DE REÇU ET DATE ==========
  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPosition, pageWidth - 30, 25, "F");

  addText(
    `Reçu N° ${payment.id.slice(0, 12).toUpperCase()}`,
    20,
    yPosition + 8,
    11,
    "bold"
  );
  addText(
    `Date: ${new Date(
      payment.datePaiement?.toDate?.() || payment.datePaiement || new Date()
    ).toLocaleDateString("fr-FR")} à ${new Date(
      payment.datePaiement?.toDate?.() || payment.datePaiement || new Date()
    ).toLocaleTimeString("fr-FR")}`,
    20,
    yPosition + 18,
    10
  );

  yPosition += 35;

  // ========== INFORMATIONS RÉSERVATION ==========
  addText("INFORMATIONS RÉSERVATION", 20, yPosition, 12, "bold");
  yPosition += 8;

  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPosition, pageWidth - 30, 35, "F");

  addText("Réservation:", 20, yPosition + 8, 10, "bold");
  addText(`#${reservation.id.slice(0, 8)}`, 60, yPosition + 8, 10);

  addText("Véhicule:", 20, yPosition + 16, 10, "bold");
  addText(
    `${reservation.vehicleMarque} ${reservation.vehicleModele}`,
    60,
    yPosition + 16,
    10
  );

  addText("Période:", 20, yPosition + 24, 10, "bold");
  addText(
    `Du ${new Date(
      reservation.dateDebut.toDate
        ? reservation.dateDebut.toDate()
        : reservation.dateDebut
    ).toLocaleDateString("fr-FR")} au ${new Date(
      reservation.dateFin.toDate
        ? reservation.dateFin.toDate()
        : reservation.dateFin
    ).toLocaleDateString("fr-FR")}`,
    60,
    yPosition + 24,
    10
  );

  yPosition += 45;

  // ========== DÉTAILS DU PAIEMENT ==========
  addText("DÉTAILS DU PAIEMENT", 20, yPosition, 12, "bold");
  yPosition += 8;

  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPosition, pageWidth - 30, 50, "F");

  addText("Méthode de paiement:", 20, yPosition + 8, 10, "bold");
  addText("Espèces (Cash)", 70, yPosition + 8, 10);

  addText("Payé par:", 20, yPosition + 16, 10, "bold");
  addText(payment.payePar, 70, yPosition + 16, 10);

  addText("Reçu par:", 20, yPosition + 24, 10, "bold");
  addText(loueurNom, 70, yPosition + 24, 10);

  addText("Montant:", 20, yPosition + 32, 10, "bold");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text(`${payment.montant.toFixed(2)} MAD`, 70, yPosition + 32);
  doc.setTextColor(31, 41, 55);

  yPosition += 60;

  // ========== NOTES (SI PRÉSENTES) ==========
  if (payment.notes) {
    addText("NOTES", 20, yPosition, 12, "bold");
    yPosition += 8;

    doc.setFillColor(243, 244, 246);
    const notesLines = doc.splitTextToSize(payment.notes, pageWidth - 50);
    const notesHeight = notesLines.length * 7 + 10;
    doc.rect(15, yPosition, pageWidth - 30, notesHeight, "F");

    notesLines.forEach((line: string, index: number) => {
      addText(line, 20, yPosition + 8 + index * 7, 9);
    });

    yPosition += notesHeight + 10;
  }

  // ========== FOOTER ==========
  yPosition += 20;
  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPosition, pageWidth - 30, 25, "F");

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(
    "Ce reçu confirme le paiement de la réservation.",
    pageWidth / 2,
    yPosition + 8,
    { align: "center" }
  );
  doc.text(
    "Document généré automatiquement par SIIIIIR Rent.",
    pageWidth / 2,
    yPosition + 16,
    { align: "center" }
  );

  // Retourner le blob
  return doc.output("blob");
}
