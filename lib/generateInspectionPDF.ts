import jsPDF from "jspdf";
import {
  Reservation,
  Vehicle,
  InspectionPhoto,
  InspectionChecklist,
  InspectionType,
  photoCategoryLabels,
  qualityLevelLabels,
  fluidLevelLabels,
} from "./types";

interface GenerateInspectionPDFParams {
  reservation: Reservation;
  vehicle: Vehicle;
  photos: InspectionPhoto[];
  checklist: InspectionChecklist;
  observations: string;
  signature: string;
  type: InspectionType;
  signerName: string;
}

export async function generateInspectionPDF({
  reservation,
  vehicle,
  photos,
  checklist,
  observations,
  signature,
  type,
  signerName,
}: GenerateInspectionPDFParams): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
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
    doc.setTextColor(31, 41, 55); // gray-800
    doc.text(text, x, y);
  };

  // Helper: Ajouter une nouvelle page si nécessaire
  const checkAddPage = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // ========== PAGE 1 : EN-TÊTE ET INFOS ==========

  // En-tête
  doc.setFillColor(22, 163, 74); // green-600
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SIIIIIR RENT", 20, 20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `État des lieux - ${type === "checkin" ? "Entrée" : "Sortie"}`,
    20,
    28
  );

  yPosition = 45;

  // Infos réservation
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(15, yPosition, pageWidth - 30, 35, "F");

  addText("INFORMATIONS RÉSERVATION", 20, yPosition + 7, 11, "bold");
  addText(`Réservation #${reservation.id.slice(0, 8)}`, 20, yPosition + 14, 9);
  addText(
    `Du ${new Date(
      reservation.dateDebut.toDate
        ? reservation.dateDebut.toDate()
        : reservation.dateDebut
    ).toLocaleDateString("fr-FR")}`,
    20,
    yPosition + 21,
    9
  );
  addText(
    `Au ${new Date(
      reservation.dateFin.toDate
        ? reservation.dateFin.toDate()
        : reservation.dateFin
    ).toLocaleDateString("fr-FR")}`,
    20,
    yPosition + 28,
    9
  );

  addText("Loueur:", pageWidth / 2 + 10, yPosition + 14, 9, "bold");
  addText(
    reservation.locataireNom || "N/A",
    pageWidth / 2 + 10,
    yPosition + 21,
    9
  );

  yPosition += 45;

  // Infos véhicule
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(15, yPosition, pageWidth - 30, 28, "F");

  addText("VÉHICULE", 20, yPosition + 7, 11, "bold");
  addText(
    `${vehicle.marque} ${vehicle.modele} (${vehicle.annee})`,
    20,
    yPosition + 14,
    9
  );
  addText(
    `Immatriculation: ${vehicle.immatriculation || "N/A"}`,
    20,
    yPosition + 21,
    9
  );

  yPosition += 38;

  // Photos (miniatures)
  addText("PHOTOS DU VÉHICULE", 20, yPosition, 11, "bold");
  yPosition += 8;

  if (photos.length > 0) {
    // Grouper par catégorie
    const photosByCategory = photos.reduce((acc, photo) => {
      if (!acc[photo.category]) {
        acc[photo.category] = [];
      }
      acc[photo.category].push(photo);
      return acc;
    }, {} as Record<string, InspectionPhoto[]>);

    for (const [category, categoryPhotos] of Object.entries(photosByCategory)) {
      checkAddPage(25);

      addText(
        `${
          photoCategoryLabels[category as keyof typeof photoCategoryLabels]
        }: ${categoryPhotos.length} photo(s)`,
        20,
        yPosition,
        9
      );
      yPosition += 7;

      // Afficher max 3 miniatures par catégorie
      const displayPhotos = categoryPhotos.slice(0, 3);
      const thumbWidth = 25;
      const thumbHeight = 25;
      let xPos = 25;

      for (let i = 0; i < displayPhotos.length; i++) {
        try {
          doc.addImage(
            displayPhotos[i].url,
            "JPEG",
            xPos,
            yPosition,
            thumbWidth,
            thumbHeight
          );
          xPos += thumbWidth + 5;
        } catch (error) {
          console.error("Erreur ajout image:", error);
        }
      }

      yPosition += thumbHeight + 5;
    }
  } else {
    addText("Aucune photo", 25, yPosition, 9);
    yPosition += 7;
  }

  // ========== PAGE 2 : CHECKLIST ==========
  doc.addPage();
  yPosition = 20;

  addText("CHECKLIST D'INSPECTION", 20, yPosition, 14, "bold");
  yPosition += 10;

  // Section Carrosserie
  checkAddPage();
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(15, yPosition, pageWidth - 30, 8, "F");
  addText("CARROSSERIE", 20, yPosition + 5, 10, "bold");
  yPosition += 12;

  addText(
    `Rayures: ${checklist.carrosserie.rayures ? "Oui" : "Non"}`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  if (checklist.carrosserie.rayuresDetails) {
    addText(`  -> ${checklist.carrosserie.rayuresDetails}`, 25, yPosition, 8);
    yPosition += 5;
  }

  addText(
    `Bosses: ${checklist.carrosserie.bosses ? "Oui" : "Non"}`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  if (checklist.carrosserie.bossesDetails) {
    addText(`  -> ${checklist.carrosserie.bossesDetails}`, 25, yPosition, 8);
    yPosition += 5;
  }

  addText(
    `Peinture: ${qualityLevelLabels[checklist.carrosserie.peinture]}`,
    25,
    yPosition,
    9
  );
  yPosition += 7;

  // Section Mécanique
  checkAddPage();
  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPosition, pageWidth - 30, 8, "F");
  addText("MÉCANIQUE", 20, yPosition + 5, 10, "bold");
  yPosition += 12;

  addText(
    `Moteur: ${qualityLevelLabels[checklist.mecanique.moteur]}`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  addText(
    `Freins: ${qualityLevelLabels[checklist.mecanique.freins]}`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  addText(
    `Suspension: ${qualityLevelLabels[checklist.mecanique.suspension]}`,
    25,
    yPosition,
    9
  );
  yPosition += 7;

  // Section Intérieur
  checkAddPage();
  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPosition, pageWidth - 30, 8, "F");
  addText("INTÉRIEUR", 20, yPosition + 5, 10, "bold");
  yPosition += 12;

  addText(
    `Sièges: ${qualityLevelLabels[checklist.interieur.sieges]}`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  addText(
    `Tableau de bord: ${qualityLevelLabels[checklist.interieur.tableauBord]}`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  addText(
    `Propreté: ${qualityLevelLabels[checklist.interieur.proprete]}`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  addText(
    `Odeur particulière: ${checklist.interieur.odeur ? "Oui" : "Non"}`,
    25,
    yPosition,
    9
  );
  yPosition += 7;

  // Section Pneus
  checkAddPage();
  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPosition, pageWidth - 30, 8, "F");
  addText("PNEUS", 20, yPosition + 5, 10, "bold");
  yPosition += 12;

  addText(
    `Avant Gauche: ${qualityLevelLabels[checklist.pneus.avantGauche]}`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  addText(
    `Avant Droit: ${qualityLevelLabels[checklist.pneus.avantDroit]}`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  addText(
    `Arrière Gauche: ${qualityLevelLabels[checklist.pneus.arriereGauche]}`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  addText(
    `Arrière Droit: ${qualityLevelLabels[checklist.pneus.arriereDroit]}`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  addText(
    `Roue de secours: ${checklist.pneus.roueSecours ? "Présente" : "Absente"}`,
    25,
    yPosition,
    9
  );
  yPosition += 7;

  // Section Niveaux
  checkAddPage();
  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPosition, pageWidth - 30, 8, "F");
  addText("NIVEAUX", 20, yPosition + 5, 10, "bold");
  yPosition += 12;

  addText(`Carburant: ${checklist.niveaux.carburant}%`, 25, yPosition, 9);
  yPosition += 5;
  addText(`Kilométrage: ${checklist.niveaux.kilometrage} km`, 25, yPosition, 9);
  yPosition += 5;
  addText(
    `Huile: ${fluidLevelLabels[checklist.niveaux.huile]}`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  addText(
    `Liquide refroidissement: ${
      fluidLevelLabels[checklist.niveaux.liquideRefroidissement]
    }`,
    25,
    yPosition,
    9
  );
  yPosition += 5;
  addText(
    `Liquide frein: ${fluidLevelLabels[checklist.niveaux.liquideFrein]}`,
    25,
    yPosition,
    9
  );
  yPosition += 7;

  // Section Équipements
  checkAddPage();
  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPosition, pageWidth - 30, 8, "F");
  addText("ÉQUIPEMENTS", 20, yPosition + 5, 10, "bold");
  yPosition += 12;

  const equipements = [
    {
      label: "Triangle de signalisation",
      value: checklist.equipements.triangleSignalisation,
    },
    { label: "Gilet de sécurité", value: checklist.equipements.giletSecurite },
    { label: "Extincteur", value: checklist.equipements.extincteur },
    {
      label: "Trousse de secours",
      value: checklist.equipements.trousseSecours,
    },
    { label: "Cric", value: checklist.equipements.cric },
    { label: "Clé à roues", value: checklist.equipements.cleRoues },
    { label: "Documents de bord", value: checklist.equipements.documentsBord },
  ];

  equipements.forEach((equip) => {
    addText(`${equip.label}: ${equip.value ? "✓" : "✗"}`, 25, yPosition, 9);
    yPosition += 5;
  });
  yPosition += 5;

  // Observations
  if (observations) {
    checkAddPage(30);
    doc.setFillColor(243, 244, 246);
    doc.rect(15, yPosition, pageWidth - 30, 8, "F");
    addText("OBSERVATIONS", 20, yPosition + 5, 10, "bold");
    yPosition += 12;

    const lines = doc.splitTextToSize(observations, pageWidth - 50);
    lines.forEach((line: string) => {
      checkAddPage();
      addText(line, 25, yPosition, 9);
      yPosition += 5;
    });
    yPosition += 5;
  }

  // Signature
  checkAddPage(50);
  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPosition, pageWidth - 30, 8, "F");
  addText("SIGNATURE", 20, yPosition + 5, 10, "bold");
  yPosition += 12;

  addText(`Signé par: ${signerName}`, 25, yPosition, 9);
  yPosition += 5;
  addText(
    `Date: ${new Date().toLocaleDateString(
      "fr-FR"
    )} à ${new Date().toLocaleTimeString("fr-FR")}`,
    25,
    yPosition,
    9
  );
  yPosition += 10;

  // Ajouter la signature
  if (signature) {
    try {
      doc.addImage(signature, "PNG", 25, yPosition, 60, 30);
    } catch (error) {
      console.error("Erreur ajout signature:", error);
    }
  }

  // Retourner le blob
  return doc.output("blob");
}
