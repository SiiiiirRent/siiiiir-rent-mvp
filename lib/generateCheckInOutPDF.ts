// lib/generateCheckInOutPDF.ts
import jsPDF from "jspdf";
import { Reservation, CheckInData, CheckOutData } from "@/lib/types";

// ==========================================
// UTILITAIRES
// ==========================================

/**
 * Convertir une image Firebase Storage URL en base64
 * ✅ VERSION FIREBASE SDK (contourne CORS)
 */
async function urlToBase64(url: string): Promise<string> {
  try {
    console.log(`🔄 Conversion image: ${url.substring(0, 80)}...`);

    // Extraire le chemin Firebase Storage depuis l'URL
    // URL format: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media&token=...
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);

    if (!pathMatch) {
      console.error("❌ Format URL invalide:", url);
      return "";
    }

    // Décoder le chemin (les %2F deviennent des /)
    const storagePath = decodeURIComponent(pathMatch[1]);
    console.log(`📁 Chemin Storage: ${storagePath}`);

    // Importer Firebase Storage
    const { ref, getBlob } = await import("firebase/storage");
    const { storage } = await import("@/lib/firebase");

    // Créer une référence et télécharger le blob
    const storageRef = ref(storage, storagePath);
    const blob = await getBlob(storageRef);
    console.log(`✅ Blob téléchargé: ${blob.size} bytes`);

    // Convertir le blob en base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        console.log(
          `✅ Image convertie en base64: ${result.substring(0, 50)}...`
        );
        resolve(result);
      };
      reader.onerror = (error) => {
        console.error("❌ Erreur FileReader:", error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("❌ Erreur conversion image:", url, error);
    return "";
  }
}

/**
 * Ajouter une image au PDF
 */
function addImageToPDF(
  doc: jsPDF,
  imgData: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  try {
    if (imgData && imgData.startsWith("data:image")) {
      doc.addImage(imgData, "JPEG", x, y, width, height);
      console.log(`✅ Image ajoutée au PDF à position (${x}, ${y})`);
    } else {
      console.warn(
        `⚠️ Image ignorée (format invalide): ${imgData.substring(0, 30)}...`
      );
    }
  } catch (error) {
    console.error("❌ Erreur ajout image au PDF:", error);
  }
}

/**
 * Formater une date
 */
function formatDate(date: any): string {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==========================================
// GÉNÉRATION PDF CHECK-IN
// ==========================================

export async function generateCheckinPDF(
  reservation: Reservation,
  loueurNom: string
): Promise<Blob> {
  console.log("📄 Début génération PDF check-in...");
  const doc = new jsPDF();
  let yPosition = 20;

  // ==========================================
  // HEADER
  // ==========================================
  doc.setFontSize(20);
  doc.setTextColor(22, 163, 74); // Vert SIIIIIR
  doc.text("SIIIIIR RENT", 105, yPosition, { align: "center" });
  yPosition += 10;

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("État des lieux - ENTRÉE", 105, yPosition, { align: "center" });
  yPosition += 15;

  // ==========================================
  // INFOS RÉSERVATION
  // ==========================================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Informations réservation", 20, yPosition);
  yPosition += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const infoLines = [
    `Réservation N° : ${reservation.id.slice(0, 8).toUpperCase()}`,
    `Véhicule : ${reservation.vehicleMarque} ${reservation.vehicleModele}`,
    `Date début : ${formatDate(reservation.dateDebut)}`,
    `Date fin : ${formatDate(reservation.dateFin)}`,
    `Loueur : ${loueurNom}`,
    `Locataire : ${reservation.locataireNom}`,
  ];

  infoLines.forEach((line) => {
    doc.text(line, 20, yPosition);
    yPosition += 5;
  });

  yPosition += 5;

  // ==========================================
  // ÉTAT DU VÉHICULE
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("État du véhicule à l'entrée", 20, yPosition);
  yPosition += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (reservation.checkin) {
    doc.text(
      `Kilométrage : ${reservation.checkin.kilometrage} km`,
      20,
      yPosition
    );
    yPosition += 5;
    doc.text(`Carburant : ${reservation.checkin.carburant}`, 20, yPosition);
    yPosition += 5;

    if (reservation.checkin.notes) {
      doc.text("Remarques :", 20, yPosition);
      yPosition += 5;
      const splitNotes = doc.splitTextToSize(reservation.checkin.notes, 170);
      doc.text(splitNotes, 20, yPosition);
      yPosition += splitNotes.length * 5 + 5;
    }
  }

  yPosition += 5;

  // ==========================================
  // PHOTOS
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Photos du véhicule", 20, yPosition);
  yPosition += 7;

  if (reservation.checkin?.photos && reservation.checkin.photos.length > 0) {
    console.log(
      `📸 Traitement de ${reservation.checkin.photos.length} photos...`
    );

    const photosPerRow = 3;
    const photoWidth = 50;
    const photoHeight = 35;
    const spacing = 8;

    for (let i = 0; i < reservation.checkin.photos.length; i++) {
      const photo = reservation.checkin.photos[i];
      const col = i % photosPerRow;
      const row = Math.floor(i / photosPerRow);

      const xPos = 20 + col * (photoWidth + spacing);
      const yPos = yPosition + row * (photoHeight + 12);

      // Nouvelle page si nécessaire
      if (yPos + photoHeight > 270) {
        doc.addPage();
        yPosition = 20;
        const newRow = 0;
        const newYPos = yPosition + newRow * (photoHeight + 12);

        try {
          console.log(
            `📷 Photo ${i + 1}/${reservation.checkin.photos.length} (${photo.type})`
          );
          const base64 = await urlToBase64(photo.url);
          if (base64) {
            addImageToPDF(doc, base64, xPos, newYPos, photoWidth, photoHeight);
          }
          doc.setFontSize(8);
          doc.text(
            photo.type.replace("_", " "),
            xPos + photoWidth / 2,
            newYPos + photoHeight + 3,
            { align: "center" }
          );
        } catch (error) {
          console.error(`❌ Erreur photo ${i + 1}:`, error);
        }
      } else {
        try {
          console.log(
            `📷 Photo ${i + 1}/${reservation.checkin.photos.length} (${photo.type})`
          );
          const base64 = await urlToBase64(photo.url);
          if (base64) {
            addImageToPDF(doc, base64, xPos, yPos, photoWidth, photoHeight);
          }
          doc.setFontSize(8);
          doc.text(
            photo.type.replace("_", " "),
            xPos + photoWidth / 2,
            yPos + photoHeight + 3,
            { align: "center" }
          );
        } catch (error) {
          console.error(`❌ Erreur photo ${i + 1}:`, error);
        }
      }
    }

    const totalRows = Math.ceil(
      reservation.checkin.photos.length / photosPerRow
    );
    yPosition += totalRows * (photoHeight + 12) + 10;
  }

  // Nouvelle page pour signatures
  doc.addPage();
  yPosition = 20;

  // ==========================================
  // SIGNATURES
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Signatures", 105, yPosition, { align: "center" });
  yPosition += 10;

  // Signature locataire
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Signature du locataire :", 20, yPosition);
  yPosition += 5;

  if (reservation.checkin?.signatureLocataire) {
    console.log(
      "🖊️ Signature locataire présente:",
      reservation.checkin.signatureLocataire.substring(0, 50)
    );
    try {
      addImageToPDF(
        doc,
        reservation.checkin.signatureLocataire,
        20,
        yPosition,
        80,
        30
      );
      console.log("✅ Signature locataire ajoutée au PDF");
    } catch (error) {
      console.error("❌ Erreur signature locataire:", error);
    }
  } else {
    console.log("⚠️ Pas de signature locataire");
  }

  doc.text(reservation.locataireNom, 20, yPosition + 35);
  doc.text(
    `Date : ${formatDate(reservation.checkin?.createdAt)}`,
    20,
    yPosition + 40
  );

  // Signature loueur
  doc.text("Signature du loueur :", 110, yPosition);

  if (reservation.checkin?.signatureLoueur) {
    console.log(
      "🖊️ Signature loueur présente:",
      reservation.checkin.signatureLoueur.substring(0, 50)
    );
    try {
      addImageToPDF(
        doc,
        reservation.checkin.signatureLoueur,
        110,
        yPosition,
        80,
        30
      );
      console.log("✅ Signature loueur ajoutée au PDF");
    } catch (error) {
      console.error("❌ Erreur signature loueur:", error);
    }
  } else {
    console.log("⚠️ Pas de signature loueur dans reservation.checkin");
  }

  doc.text(loueurNom, 110, yPosition + 35);
  // ✅ CORRECTION : Fallback sur new Date() si validatedAt est null
  doc.text(
    `Date : ${formatDate(reservation.checkin?.validatedAt || new Date())}`,
    110,
    yPosition + 40
  );

  // ==========================================
  // FOOTER
  // ==========================================
  yPosition = 280;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Document généré par SIIIIIR Rent - www.siiiirrent.ma",
    105,
    yPosition,
    { align: "center" }
  );

  console.log("✅ PDF check-in généré avec succès");
  return doc.output("blob");
}

// ==========================================
// GÉNÉRATION PDF CHECK-OUT
// ==========================================

export async function generateCheckoutPDF(
  reservation: Reservation,
  loueurNom: string
): Promise<Blob> {
  console.log("📄 Début génération PDF check-out...");
  const doc = new jsPDF();
  let yPosition = 20;

  // ==========================================
  // HEADER
  // ==========================================
  doc.setFontSize(20);
  doc.setTextColor(22, 163, 74);
  doc.text("SIIIIIR RENT", 105, yPosition, { align: "center" });
  yPosition += 10;

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("État des lieux - SORTIE", 105, yPosition, { align: "center" });
  yPosition += 15;

  // ==========================================
  // INFOS RÉSERVATION
  // ==========================================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Informations réservation", 20, yPosition);
  yPosition += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const infoLines = [
    `Réservation N° : ${reservation.id.slice(0, 8).toUpperCase()}`,
    `Véhicule : ${reservation.vehicleMarque} ${reservation.vehicleModele}`,
    `Date début : ${formatDate(reservation.dateDebut)}`,
    `Date fin : ${formatDate(reservation.dateFin)}`,
    `Loueur : ${loueurNom}`,
    `Locataire : ${reservation.locataireNom}`,
  ];

  infoLines.forEach((line) => {
    doc.text(line, 20, yPosition);
    yPosition += 5;
  });

  yPosition += 5;

  // ==========================================
  // COMPARAISON ÉTAT DU VÉHICULE
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Comparaison état du véhicule", 20, yPosition);
  yPosition += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (reservation.checkin && reservation.checkout) {
    const kmDiff =
      reservation.checkout.kilometrage - reservation.checkin.kilometrage;

    doc.text(
      `Kilométrage entrée : ${reservation.checkin.kilometrage} km`,
      20,
      yPosition
    );
    yPosition += 5;
    doc.text(
      `Kilométrage sortie : ${reservation.checkout.kilometrage} km`,
      20,
      yPosition
    );
    yPosition += 5;
    doc.setFont("helvetica", "bold");
    doc.text(`Distance parcourue : ${kmDiff} km`, 20, yPosition);
    doc.setFont("helvetica", "normal");
    yPosition += 7;

    doc.text(
      `Carburant entrée : ${reservation.checkin.carburant}`,
      20,
      yPosition
    );
    yPosition += 5;
    doc.text(
      `Carburant sortie : ${reservation.checkout.carburant}`,
      20,
      yPosition
    );
    yPosition += 7;

    if (reservation.checkout.notes) {
      doc.text("Remarques à la sortie :", 20, yPosition);
      yPosition += 5;
      const splitNotes = doc.splitTextToSize(reservation.checkout.notes, 170);
      doc.text(splitNotes, 20, yPosition);
      yPosition += splitNotes.length * 5 + 5;
    }
  }

  yPosition += 5;

  // ==========================================
  // STATUT LITIGE
  // ==========================================
  if (reservation.checkout?.litige?.declared) {
    console.log("⚠️ Litige détecté, ajout au PDF");
    doc.setFillColor(255, 0, 0);
    doc.rect(20, yPosition - 3, 170, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("⚠️ LITIGE DÉCLARÉ", 105, yPosition + 3, { align: "center" });
    yPosition += 12;

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(`Raison : ${reservation.checkout.litige.reason}`, 20, yPosition);
    yPosition += 5;
    doc.text(
      `Montant réclamé : ${reservation.checkout.litige.montantReclame} MAD`,
      20,
      yPosition
    );
    yPosition += 10;
  }

  // ==========================================
  // PHOTOS CHECK-OUT
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Photos du véhicule à la sortie", 20, yPosition);
  yPosition += 7;

  if (reservation.checkout?.photos && reservation.checkout.photos.length > 0) {
    console.log(
      `📸 Traitement de ${reservation.checkout.photos.length} photos check-out...`
    );

    const photosPerRow = 3;
    const photoWidth = 50;
    const photoHeight = 35;
    const spacing = 8;

    for (let i = 0; i < reservation.checkout.photos.length; i++) {
      const photo = reservation.checkout.photos[i];
      const col = i % photosPerRow;
      const row = Math.floor(i / photosPerRow);

      const xPos = 20 + col * (photoWidth + spacing);
      const yPos = yPosition + row * (photoHeight + 12);

      if (yPos + photoHeight > 270) {
        doc.addPage();
        yPosition = 20;
        const newRow = 0;
        const newYPos = yPosition + newRow * (photoHeight + 12);

        try {
          console.log(
            `📷 Photo ${i + 1}/${reservation.checkout.photos.length} (${photo.type})`
          );
          const base64 = await urlToBase64(photo.url);
          if (base64) {
            addImageToPDF(doc, base64, xPos, newYPos, photoWidth, photoHeight);
          }
          doc.setFontSize(8);
          doc.text(
            photo.type.replace("_", " "),
            xPos + photoWidth / 2,
            newYPos + photoHeight + 3,
            { align: "center" }
          );
        } catch (error) {
          console.error(`❌ Erreur photo ${i + 1}:`, error);
        }
      } else {
        try {
          console.log(
            `📷 Photo ${i + 1}/${reservation.checkout.photos.length} (${photo.type})`
          );
          const base64 = await urlToBase64(photo.url);
          if (base64) {
            addImageToPDF(doc, base64, xPos, yPos, photoWidth, photoHeight);
          }
          doc.setFontSize(8);
          doc.text(
            photo.type.replace("_", " "),
            xPos + photoWidth / 2,
            yPos + photoHeight + 3,
            { align: "center" }
          );
        } catch (error) {
          console.error(`❌ Erreur photo ${i + 1}:`, error);
        }
      }
    }

    const totalRows = Math.ceil(
      reservation.checkout.photos.length / photosPerRow
    );
    yPosition += totalRows * (photoHeight + 12) + 10;
  }

  // Nouvelle page pour signatures
  doc.addPage();
  yPosition = 20;

  // ==========================================
  // SIGNATURES
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Signatures", 105, yPosition, { align: "center" });
  yPosition += 10;

  // Signature locataire
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Signature du locataire :", 20, yPosition);
  yPosition += 5;

  if (reservation.checkout?.signatureLocataire) {
    console.log(
      "🖊️ Signature locataire présente:",
      reservation.checkout.signatureLocataire.substring(0, 50)
    );
    try {
      addImageToPDF(
        doc,
        reservation.checkout.signatureLocataire,
        20,
        yPosition,
        80,
        30
      );
      console.log("✅ Signature locataire ajoutée au PDF");
    } catch (error) {
      console.error("❌ Erreur signature locataire:", error);
    }
  } else {
    console.log("⚠️ Pas de signature locataire");
  }

  doc.text(reservation.locataireNom, 20, yPosition + 35);
  doc.text(
    `Date : ${formatDate(reservation.checkout?.createdAt)}`,
    20,
    yPosition + 40
  );

  // Signature loueur
  doc.text("Signature du loueur :", 110, yPosition);

  if (reservation.checkout?.signatureLoueur) {
    console.log(
      "🖊️ Signature loueur présente:",
      reservation.checkout.signatureLoueur.substring(0, 50)
    );
    try {
      addImageToPDF(
        doc,
        reservation.checkout.signatureLoueur,
        110,
        yPosition,
        80,
        30
      );
      console.log("✅ Signature loueur ajoutée au PDF");
    } catch (error) {
      console.error("❌ Erreur signature loueur:", error);
    }
  } else {
    console.log("⚠️ Pas de signature loueur dans reservation.checkout");
  }

  doc.text(loueurNom, 110, yPosition + 35);
  // ✅ CORRECTION : Fallback sur new Date() si validatedAt est null
  doc.text(
    `Date : ${formatDate(reservation.checkout?.validatedAt || new Date())}`,
    110,
    yPosition + 40
  );

  // ==========================================
  // FOOTER
  // ==========================================
  yPosition = 280;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Document généré par SIIIIIR Rent - www.siiiirrent.ma",
    105,
    yPosition,
    { align: "center" }
  );

  console.log("✅ PDF check-out généré avec succès");
  return doc.output("blob");
}
