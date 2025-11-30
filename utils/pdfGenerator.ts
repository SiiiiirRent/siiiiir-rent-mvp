/**
 * utils/pdfGenerator.ts
 * Génération de PDFs pour les contrats de location
 */

import jsPDF from "jspdf";
import { Reservation } from "@/lib/types";

/**
 * Générer un contrat de location en PDF
 */
export async function generateContractPDF(
  reservation: Reservation,
  ownerInfo: {
    nom: string;
    prenom: string;
    adresse: string;
    telephone: string;
    email: string;
    companyName?: string;
    ice?: string;
  },
  vehicleInfo: {
    immatriculation: string;
    annee: number;
    type: string;
    transmission: string;
  },
  ownerSignature?: string,
  renterSignature?: string
): Promise<Blob> {
  const doc = new jsPDF();

  // Configuration
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let y = 20;

  // Helper pour ajouter du texte
  const addText = (text: string, fontSize = 11, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.text(text, margin, y);
    y += fontSize * 0.5;
  };

  const addLine = () => {
    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // ===== EN-TÊTE =====
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CONTRAT DE LOCATION DE VÉHICULE", pageWidth / 2, y, {
    align: "center",
  });
  y += 15;

  addLine();

  // ===== INFORMATIONS LOUEUR =====
  addText("LE LOUEUR", 14, true);
  y += 3;

  if (ownerInfo.companyName) {
    addText(`Société : ${ownerInfo.companyName}`, 11, true);
    if (ownerInfo.ice) {
      addText(`ICE : ${ownerInfo.ice}`);
    }
  }

  addText(`Nom : ${ownerInfo.prenom} ${ownerInfo.nom}`, 11, true);
  addText(`Adresse : ${ownerInfo.adresse}`);
  addText(`Téléphone : ${ownerInfo.telephone}`);
  addText(`Email : ${ownerInfo.email}`);
  y += 5;

  addLine();

  // ===== INFORMATIONS LOCATAIRE =====
  addText("LE LOCATAIRE", 14, true);
  y += 3;
  addText(`Nom : ${reservation.locataireNom}`, 11, true);
  if (reservation.locatairePhone) {
    addText(`Téléphone : ${reservation.locatairePhone}`);
  }
  addText(`Email : ${reservation.locataireEmail}`);
  y += 5;

  addLine();

  // ===== INFORMATIONS VÉHICULE =====
  addText("LE VÉHICULE", 14, true);
  y += 3;
  addText(
    `Marque et Modèle : ${reservation.vehicleMarque} ${reservation.vehicleModele}`,
    11,
    true
  );
  addText(`Immatriculation : ${vehicleInfo.immatriculation}`);
  addText(`Année : ${vehicleInfo.annee}`);
  addText(`Type : ${vehicleInfo.type}`);
  addText(`Transmission : ${vehicleInfo.transmission}`);
  y += 5;

  addLine();

  // ===== DURÉE ET PRIX =====
  addText("DURÉE ET PRIX", 14, true);
  y += 3;

  const dateDebut = reservation.dateDebut?.toDate
    ? reservation.dateDebut.toDate()
    : new Date(reservation.dateDebut);
  const dateFin = reservation.dateFin?.toDate
    ? reservation.dateFin.toDate()
    : new Date(reservation.dateFin);

  addText(`Date de début : ${dateDebut.toLocaleDateString("fr-FR")}`);
  addText(`Date de fin : ${dateFin.toLocaleDateString("fr-FR")}`);
  addText(`Nombre de jours : ${reservation.nbJours}`, 11, true);
  addText(`Prix par jour : ${reservation.vehiclePrixJour} MAD`);
  addText(`PRIX TOTAL : ${reservation.prixTotal} MAD`, 12, true);
  y += 5;

  addLine();

  // ===== CONDITIONS =====
  addText("CONDITIONS GÉNÉRALES", 14, true);
  y += 3;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const conditions = [
    "1. Le locataire s'engage à restituer le véhicule dans l'état où il l'a reçu.",
    "2. Le locataire est responsable de tous dommages causés au véhicule pendant la durée de location.",
    "3. Le locataire s'engage à respecter le Code de la route marocain.",
    "4. Le véhicule ne peut être sous-loué sans accord écrit du loueur.",
    "5. En cas de retard, des frais supplémentaires seront appliqués.",
    "6. Le locataire doit disposer d'un permis de conduire valide.",
  ];

  conditions.forEach((condition) => {
    const lines = doc.splitTextToSize(condition, pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  });

  y += 5;
  addLine();

  // ===== SIGNATURES (TOUJOURS SUR UNE NOUVELLE PAGE) =====
  doc.addPage(); // 🆕 FORCER UNE PAGE 2
  y = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SIGNATURES", pageWidth / 2, y, { align: "center" });
  y += 20;

  const signatureY = y;
  const signatureWidth = 60;
  const signatureHeight = 30;

  // Signature Loueur (gauche)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Le Loueur", margin, signatureY);

  if (ownerSignature) {
    try {
      doc.addImage(
        ownerSignature,
        "PNG",
        margin,
        signatureY + 10,
        signatureWidth,
        signatureHeight
      );
      console.log("✅ Signature loueur ajoutée au PDF");
    } catch (error) {
      console.error("❌ Erreur ajout signature loueur:", error);
    }
  } else {
    // Cadre vide si pas de signature
    doc.rect(margin, signatureY + 10, signatureWidth, signatureHeight);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.line(
    margin,
    signatureY + signatureHeight + 15,
    margin + signatureWidth,
    signatureY + signatureHeight + 15
  );
  doc.text(
    `Date : ${new Date().toLocaleDateString("fr-FR")}`,
    margin,
    signatureY + signatureHeight + 20
  );

  // Signature Locataire (droite)
  const rightX = pageWidth - margin - signatureWidth - 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Le Locataire", rightX, signatureY);

  if (renterSignature) {
    try {
      doc.addImage(
        renterSignature,
        "PNG",
        rightX,
        signatureY + 10,
        signatureWidth,
        signatureHeight
      );
      console.log("✅ Signature locataire ajoutée au PDF");
    } catch (error) {
      console.error("❌ Erreur ajout signature locataire:", error);
    }
  } else {
    // Cadre vide si pas de signature
    doc.rect(rightX, signatureY + 10, signatureWidth, signatureHeight);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.line(
    rightX,
    signatureY + signatureHeight + 15,
    rightX + signatureWidth,
    signatureY + signatureHeight + 15
  );
  doc.text(
    `Date : ${new Date().toLocaleDateString("fr-FR")}`,
    rightX,
    signatureY + signatureHeight + 20
  );

  // Footer
  y = signatureY + signatureHeight + 40;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Document généré par SIIIIIR RENT - Plateforme de location de véhicules",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // Footer
  y = signatureY + signatureHeight + 30;
  if (y > 270) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Document généré par SIIIIIR RENT - Plateforme de location de véhicules",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // Footer
  y += 55;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Document généré par SIIIIIR RENT - Plateforme de location de véhicules",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // Retourner le PDF en Blob
  return doc.output("blob");
}
