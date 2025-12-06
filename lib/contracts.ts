import { jsPDF } from "jspdf";
import { Reservation } from "./types";

interface GenerateContractPDFProps {
  reservation: Reservation;
  loueurNom: string;
  ownerSignatureBase64?: string;
  renterSignatureBase64?: string;
}

// ✅ AJOUT DE "export" ICI !
export async function generateContractPDF({
  reservation,
  loueurNom,
  ownerSignatureBase64,
  renterSignatureBase64,
}: GenerateContractPDFProps): Promise<Blob> {
  const doc = new jsPDF();

  // ========================
  // 1) EN-TÊTE
  // ========================
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CONTRAT DE LOCATION", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${reservation.id.slice(0, 8).toUpperCase()}`, 105, 30, {
    align: "center",
  });

  // ========================
  // 2) INFOS LOUEUR
  // ========================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("LE LOUEUR", 20, 50);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nom : ${loueurNom}`, 20, 60);

  // ========================
  // 3) INFOS LOCATAIRE
  // ========================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("LE LOCATAIRE", 20, 80);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nom : ${reservation.locataireNom}`, 20, 90);
  doc.text(`Email : ${reservation.locataireEmail}`, 20, 97);
  if (reservation.locatairePhone) {
    doc.text(`Téléphone : ${reservation.locatairePhone}`, 20, 104);
  }

  // ========================
  // 4) VÉHICULE
  // ========================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("VÉHICULE LOUÉ", 20, 120);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Véhicule : ${reservation.vehicleMarque} ${reservation.vehicleModele}`,
    20,
    130
  );

  // ========================
  // 5) DURÉE
  // ========================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DURÉE DE LA LOCATION", 20, 150);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const dateDebut = reservation.dateDebut.toDate
    ? reservation.dateDebut.toDate()
    : new Date(reservation.dateDebut);
  const dateFin = reservation.dateFin.toDate
    ? reservation.dateFin.toDate()
    : new Date(reservation.dateFin);

  doc.text(`Du : ${dateDebut.toLocaleDateString("fr-FR")}`, 20, 160);
  doc.text(`Au : ${dateFin.toLocaleDateString("fr-FR")}`, 20, 167);
  doc.text(`Durée : ${reservation.nbJours} jour(s)`, 20, 174);

  // ========================
  // 6) TARIFICATION
  // ========================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TARIFICATION", 20, 190);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Prix par jour : ${reservation.vehiclePrixJour} MAD`, 20, 200);
  doc.text(`Nombre de jours : ${reservation.nbJours}`, 20, 207);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL : ${reservation.prixTotal} MAD`, 20, 220);

  // ========================
  // 7) CONDITIONS GÉNÉRALES
  // ========================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CONDITIONS GÉNÉRALES", 20, 240);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const conditions = [
    "1. Le locataire s'engage à restituer le véhicule dans l'état où il l'a reçu.",
    "2. Toute dégradation sera facturée au locataire.",
    "3. Le locataire doit être en possession d'un permis de conduire valide.",
    "4. L'assurance est incluse dans le tarif de location.",
    "5. Le carburant est à la charge du locataire.",
  ];

  let yPos = 248;
  const lineHeight = 6;

  conditions.forEach((condition) => {
    doc.text(condition, 20, yPos);
    yPos += lineHeight;
  });

  // ========================
  // 8) SIGNATURES (avec gestion de 2e page)
  // ========================
  const neededHeight = 50;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20;

  if (yPos + neededHeight > pageHeight - bottomMargin) {
    doc.addPage();
    yPos = 40;
  } else {
    yPos += 10;
  }

  const signatureTop = yPos + 10;

  // Labels
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Signature du loueur", 30, signatureTop - 4);
  doc.text("Signature du locataire", 130, signatureTop - 4);

  // Rectangles
  const rectWidth = 60;
  const rectHeight = 25;

  doc.rect(20, signatureTop, rectWidth, rectHeight);
  doc.rect(120, signatureTop, rectWidth, rectHeight);

  // Ajout des images de signature
  try {
    if (ownerSignatureBase64) {
      console.log("📝 Ajout signature loueur au PDF...");
      doc.addImage(
        ownerSignatureBase64,
        "PNG",
        22,
        signatureTop + 2,
        rectWidth - 4,
        rectHeight - 4
      );
      console.log("✅ Signature loueur ajoutée au PDF");
    }

    if (renterSignatureBase64) {
      console.log("📝 Ajout signature locataire au PDF...");
      doc.addImage(
        renterSignatureBase64,
        "PNG",
        122,
        signatureTop + 2,
        rectWidth - 4,
        rectHeight - 4
      );
      console.log("✅ Signature locataire ajoutée au PDF");
    }
  } catch (error) {
    console.error("❌ Erreur ajout signatures au PDF:", error);
  }

  // ========================
  // 9) DATE DE GÉNÉRATION
  // ========================
  const finalPageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Document généré le ${new Date().toLocaleDateString("fr-FR")}`,
    105,
    finalPageHeight - 10,
    { align: "center" }
  );

  return doc.output("blob");
}
// ============================================
// FONCTIONS TEMPORAIRES (STUBS POUR BUILD)
// ============================================

export async function generateAndUploadContract(
  reservationId: string,
  reservation: any,
  ownerInfo: any,
  vehicleInfo: any,
  ownerSignature?: string,
  renterSignature?: string
): Promise<void> {
  console.log("⚠️ generateAndUploadContract - TODO: À implémenter");
  // TODO: Implémenter la génération et upload du contrat
}

export async function signContractAsOwner(
  reservationId: string,
  signatureDataURL: string
): Promise<void> {
  console.log("⚠️ signContractAsOwner - TODO: À implémenter");
  // TODO: Implémenter la signature loueur
}

export async function signContractAsRenter(
  reservationId: string,
  signatureDataURL: string
): Promise<void> {
  console.log("⚠️ signContractAsRenter - TODO: À implémenter");
  // TODO: Implémenter la signature locataire
}

export async function finalizeContract(reservationId: string): Promise<void> {
  console.log("⚠️ finalizeContract - TODO: À implémenter");
  // TODO: Implémenter la finalisation du contrat
}
