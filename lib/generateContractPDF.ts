import jsPDF from "jspdf";
import { Reservation } from "./types";

interface GenerateContractPDFProps {
  reservation: Reservation;
  loueurNom: string;
  loueurTel?: string;
  loueurAdresse?: string;
  loueurEmail?: string;
  loueurSociete?: string;
  loueurVille?: string;
  loueurPays?: string;
  ownerSignatureBase64?: string;
  renterSignatureBase64?: string;
  // ✅ NOUVEAU : Contract Settings
  contractSettings?: {
    companyName?: string;
    companyLogoUrl?: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    ice?: string;
    rc?: string;
    if?: string;
    patente?: string;
    cnss?: string;
    representantName?: string;
    representantCIN?: string;
    showRC?: boolean;
    showICE?: boolean;
    showIF?: boolean;
    showPatente?: boolean;
    showCNSS?: boolean;
  };
}

export async function generateContractPDF({
  reservation,
  loueurNom,
  loueurTel,
  loueurAdresse,
  loueurEmail,
  loueurSociete,
  loueurVille,
  loueurPays,
  ownerSignatureBase64,
  renterSignatureBase64,
  contractSettings,
}: GenerateContractPDFProps): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // ✅ Utiliser les données du contractSettings si disponibles, sinon fallback
  const companyName =
    contractSettings?.companyName || loueurSociete || "SIIIIIR RENT";
  const companyCity = contractSettings?.city || loueurVille || "";
  const companyAddress = contractSettings?.address || loueurAdresse || "";
  const companyPhone = contractSettings?.phone || loueurTel || "";
  const companyEmail = contractSettings?.email || loueurEmail || "";
  const companyWebsite = contractSettings?.website || "";

  // Informations légales
  const ice = contractSettings?.ice || "";
  const rc = contractSettings?.rc || "";
  const ifValue = contractSettings?.if || "";
  const patente = contractSettings?.patente || "";
  const cnss = contractSettings?.cnss || "";

  // Représentant légal
  const representantName = contractSettings?.representantName || loueurNom;
  const representantCIN = contractSettings?.representantCIN || "";

  // Options d'affichage
  const showRC = contractSettings?.showRC !== false;
  const showICE = contractSettings?.showICE !== false;
  const showIF = contractSettings?.showIF !== false;
  const showPatente = contractSettings?.showPatente !== false;
  const showCNSS = contractSettings?.showCNSS !== false;

  let yPosition = margin;

  // ==================== PAGE 1 : CONTRAT ====================

  // ===== EN-TÊTE =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(companyName, margin, yPosition);
  yPosition += 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  // Contact en haut à droite
  const contactX = pageWidth - margin;
  let contactY = margin;

  if (companyPhone) {
    doc.text(`Tél : ${companyPhone}`, contactX, contactY, { align: "right" });
    contactY += 4;
  }
  if (companyEmail) {
    doc.text(`Email : ${companyEmail}`, contactX, contactY, { align: "right" });
  }

  yPosition += 10;

  // ===== TITRE PRINCIPAL =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Contrat de location", pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 8;

  // Numéro de contrat
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const contractNum = `N° ${reservation.id.substring(0, 8).toUpperCase()}`;
  doc.text(contractNum, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // ===== SECTION AGENT (LOUEUR) =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("AGENT :", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  // Société
  if (companyName) {
    doc.text(`Société : ${companyName}`, margin + 5, yPosition);
    yPosition += 4;
  }

  // Nom du représentant
  doc.text(`Nom : ${representantName}`, margin + 5, yPosition);
  yPosition += 4;

  // CIN du représentant
  if (representantCIN) {
    doc.text(`CIN : ${representantCIN}`, margin + 5, yPosition);
    yPosition += 4;
  }

  // Téléphone
  if (companyPhone) {
    doc.text(`Tél : ${companyPhone}`, margin + 5, yPosition);
    yPosition += 4;
  }

  // Adresse complète
  const fullAddress = [companyAddress, companyCity, loueurPays]
    .filter(Boolean)
    .join(", ");
  if (fullAddress) {
    const addressLines = doc.splitTextToSize(
      `Adresse : ${fullAddress}`,
      contentWidth - 10
    );
    doc.text(addressLines, margin + 5, yPosition);
    yPosition += addressLines.length * 4;
  }

  // Email
  if (companyEmail) {
    doc.text(`Email : ${companyEmail}`, margin + 5, yPosition);
    yPosition += 4;
  }

  // Site web
  if (companyWebsite) {
    doc.text(`Site web : ${companyWebsite}`, margin + 5, yPosition);
    yPosition += 4;
  }

  // ===== INFORMATIONS LÉGALES =====
  yPosition += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  const legalInfo: string[] = [];
  if (showICE && ice) legalInfo.push(`ICE: ${ice}`);
  if (showRC && rc) legalInfo.push(`RC: ${rc}`);
  if (showIF && ifValue) legalInfo.push(`IF: ${ifValue}`);
  if (showPatente && patente) legalInfo.push(`Patente: ${patente}`);
  if (showCNSS && cnss) legalInfo.push(`CNSS: ${cnss}`);

  if (legalInfo.length > 0) {
    doc.text(legalInfo.join(" - "), margin + 5, yPosition);
    yPosition += 4;
  }

  yPosition += 6;

  // ===== SECTION LOCATAIRE =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("LOCATAIRE :", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const renterLastName = reservation.nom || "";
  const renterFirstName = reservation.prenom || "";
  const renterFullName =
    `${renterFirstName} ${renterLastName}`.trim() || reservation.locataireNom;

  doc.text(`Nom : ${renterLastName}`, margin + 5, yPosition);
  yPosition += 4;
  doc.text(`Prénom : ${renterFirstName}`, margin + 5, yPosition);
  yPosition += 4;

  // Adresse complète du locataire
  const renterFullAddress = [
    reservation.adresse,
    reservation.ville,
    reservation.pays,
  ]
    .filter(Boolean)
    .join(", ");

  if (renterFullAddress) {
    const renterAddressLines = doc.splitTextToSize(
      `Adresse : ${renterFullAddress}`,
      contentWidth - 10
    );
    doc.text(renterAddressLines, margin + 5, yPosition);
    yPosition += renterAddressLines.length * 4;
  }

  if (reservation.dateNaissance) {
    const birthDate =
      reservation.dateNaissance.toDate?.().toLocaleDateString("fr-FR") ||
      new Date(reservation.dateNaissance).toLocaleDateString("fr-FR");
    doc.text(`Date de naissance : ${birthDate}`, margin + 5, yPosition);
    yPosition += 4;
  }

  if (reservation.numeroCIN) {
    doc.text(
      `Nº CIN / Passeport : ${reservation.numeroCIN}`,
      margin + 5,
      yPosition
    );
    yPosition += 4;
  }

  if (reservation.dateValiditePermis) {
    const permisDate =
      reservation.dateValiditePermis.toDate?.().toLocaleDateString("fr-FR") ||
      new Date(reservation.dateValiditePermis).toLocaleDateString("fr-FR");
    doc.text(`Date validité permis : ${permisDate}`, margin + 5, yPosition);
    yPosition += 4;
  }

  if (reservation.numeroPermis) {
    doc.text(`Nº Permis : ${reservation.numeroPermis}`, margin + 5, yPosition);
    yPosition += 4;
  }

  if (reservation.locatairePhone) {
    doc.text(`Tél : ${reservation.locatairePhone}`, margin + 5, yPosition);
    yPosition += 4;
  }

  yPosition += 6;

  // ===== SECTION VÉHICULE =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("VÉHICULE :", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(
    `Marque : ${reservation.vehicleMarque || ""}`,
    margin + 5,
    yPosition
  );
  yPosition += 4;
  doc.text(
    `Modèle : ${reservation.vehicleModele || ""}`,
    margin + 5,
    yPosition
  );
  yPosition += 4;

  if (reservation.vehicleImmatriculation) {
    doc.text(
      `Immatriculation : ${reservation.vehicleImmatriculation}`,
      margin + 5,
      yPosition
    );
    yPosition += 4;
  }

  yPosition += 6;

  // ===== DATES ET LIEUX =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DATES ET LIEUX :", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const dateDebut = reservation.dateDebut.toDate
    ? reservation.dateDebut.toDate()
    : new Date(reservation.dateDebut);
  const dateFin = reservation.dateFin.toDate
    ? reservation.dateFin.toDate()
    : new Date(reservation.dateFin);

  const formatDateTime = (date: Date) => {
    return `${date.toLocaleDateString("fr-FR")} à ${date.toLocaleTimeString(
      "fr-FR",
      { hour: "2-digit", minute: "2-digit" }
    )}`;
  };

  doc.text(
    `Date de départ : ${formatDateTime(dateDebut)}`,
    margin + 5,
    yPosition
  );
  yPosition += 4;

  if (reservation.lieuDepart) {
    const lieuDepartLines = doc.splitTextToSize(
      `Lieu de départ : ${reservation.lieuDepart}`,
      contentWidth - 10
    );
    doc.text(lieuDepartLines, margin + 5, yPosition);
    yPosition += lieuDepartLines.length * 4;
  }

  doc.text(`Km départ : ${reservation.kmDepart || 0}`, margin + 5, yPosition);
  yPosition += 6;

  doc.text(
    `Date de retour : ${formatDateTime(dateFin)}`,
    margin + 5,
    yPosition
  );
  yPosition += 4;

  if (reservation.lieuRetour) {
    const lieuRetourLines = doc.splitTextToSize(
      `Lieu de retour : ${reservation.lieuRetour}`,
      contentWidth - 10
    );
    doc.text(lieuRetourLines, margin + 5, yPosition);
    yPosition += lieuRetourLines.length * 4;
  }

  doc.text(`Km retour : ${reservation.kmRetour || 0}`, margin + 5, yPosition);
  yPosition += 6;

  // ===== PRIX =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PRIX LOCATION :", margin, yPosition);
  yPosition += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(
    `Total facture : ${reservation.prixTotal || 0} DHS`,
    margin + 5,
    yPosition
  );
  yPosition += 4;
  doc.text(`1ère Avance : __________ DHS`, margin + 5, yPosition);
  yPosition += 4;
  doc.text(`2ème Avance : __________ DHS`, margin + 5, yPosition);
  yPosition += 6;

  // ===== CAUTION =====
  doc.setFont("helvetica", "bold");
  doc.text("CAUTION :", margin, yPosition);
  yPosition += 4;
  doc.setFont("helvetica", "normal");
  doc.text(`Montant : __________ DHS`, margin + 5, yPosition);
  yPosition += 8;

  // ===== REMARQUES =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("REMARQUE :", margin, yPosition);
  yPosition += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const remarques = [
    "& Carte grise & Vignette et talon",
    "& Autorisation & Assurance",
  ];

  remarques.forEach((remarque) => {
    doc.text(remarque, margin + 5, yPosition);
    yPosition += 4;
  });

  yPosition += 6;

  // ===== ÉTAT DU VÉHICULE =====
  const checkBoxSize = 3;
  const checkBoxSpacing = 50;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Etat du véhicule DÉPART:", margin, yPosition);
  doc.text("Etat du véhicule RETOUR:", margin + 95, yPosition);
  yPosition += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Voir check-in", margin + 5, yPosition);
  doc.text("Voir check-out", margin + 100, yPosition);
  yPosition += 8;

  // ===== SIGNATURES =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  const signatureY = yPosition;
  const leftSignX = margin + 20;
  const rightSignX = pageWidth - margin - 40;

  doc.text("Signature Loueur", leftSignX, signatureY, { align: "center" });
  doc.text("Signature Locataire", rightSignX, signatureY, { align: "center" });

  const signatureBoxY = signatureY + 5;
  const signatureBoxHeight = 25;

  doc.rect(leftSignX - 20, signatureBoxY, 40, signatureBoxHeight);
  doc.rect(rightSignX - 20, signatureBoxY, 40, signatureBoxHeight);

  if (ownerSignatureBase64) {
    try {
      doc.addImage(
        ownerSignatureBase64,
        "PNG",
        leftSignX - 18,
        signatureBoxY + 2,
        36,
        signatureBoxHeight - 4
      );
    } catch (error) {
      console.error("Erreur ajout signature loueur:", error);
    }
  }

  if (renterSignatureBase64) {
    try {
      doc.addImage(
        renterSignatureBase64,
        "PNG",
        rightSignX - 18,
        signatureBoxY + 2,
        36,
        signatureBoxHeight - 4
      );
    } catch (error) {
      console.error("Erreur ajout signature locataire:", error);
    }
  }

  yPosition = signatureBoxY + signatureBoxHeight + 8;

  // ===== PIED DE PAGE =====
  const footerY = pageHeight - 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const footerAddress = [companyAddress, companyCity, loueurPays]
    .filter(Boolean)
    .join(", ");

  if (footerAddress) {
    doc.text(footerAddress, pageWidth / 2, footerY, { align: "center" });
  }

  const footerContact = [
    companyPhone ? `Tél : ${companyPhone}` : "",
    companyEmail ? `Email : ${companyEmail}` : "",
  ]
    .filter(Boolean)
    .join(" - ");

  if (footerContact) {
    doc.text(footerContact, pageWidth / 2, footerY + 4, { align: "center" });
  }

  // ==================== PAGE 2 : CONDITIONS GÉNÉRALES ====================
  doc.addPage();
  yPosition = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("CONDITIONS GÉNÉRALES DE LOCATION", pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setLineHeightFactor(1.5);

  const conditions = `
CONDITIONS GÉNÉRALES DE LOCATION

Article 1 – LES CONDITIONS GÉNÉRALES
Les conditions de location font partie intégrante du présent contrat de location de véhicule.
En le signant, le locataire confirme avoir lu les conditions de location et les accepter sans condition.
Toute dérogation à ces conditions doit faire l'objet d'un accord préalable et écrit du loueur.
La société ${companyName} sera ici appelée désormais comme étant le loueur.

Article 2 – CONDITIONS DE LOCATION
Le locataire ainsi que les conducteurs autorisés par le loueur et désignés au recto du présent contrat sont tenus de présenter au loueur une carte d'identité ou un passeport en cours de validité, un permis de conduire délivré depuis plus d'un an et en cours de validité sur le territoire où il circule.
L'âge minimum requis pour l'acteur d'une location est fixé à 21 ans.
La location est personnelle et non transmissible, se conclue pour une durée déterminée précisée au recto du présent contrat.
Le locataire et les conducteurs autorisés sont personnellement responsables envers le loueur de l'exécution intégrale des présentes conditions.
Le loueur se réserve le droit de mettre fin immédiatement et de plein droit à la location sans être tenu à justification ni indemnité d'aucune sorte si le locataire n'avait pas respecté l'une des obligations essentielles du présent contrat, notamment les conditions d'utilisation du véhicule et les paiements de loyers et les conditions de restitution.

Article 3 – OBLIGATIONS DU LOCATAIRE
Le locataire s'engage à :
– Ne pas laisser conduire le véhicule par d'autres personnes que celles désignées.
– Ne pas utiliser le véhicule pour le transport et la livraison de marchandises et tout autre objet illicite.
– Dans cas de contravention le locataire sera le seul et unique responsable de ses actes devant les autorités compétentes.
– Ne pas utiliser le véhicule à des essais ou compétitions de courses, rallyes.
– Ne pas conduire le véhicule dans un état d'ivresse ou sous l'influence de drogues.
– Dans le cas contraire le locataire sera responsable de ses actes vis-à-vis du loueur pour les dommages causés au véhicule et ses accessoires.
– Payer toutes amendes ou contraventions reçues pendant la durée du contrat pour toutes infractions au code de la route.

Article 4 – DURÉE DE LA LOCATION
Le locataire s'engage à restituer le véhicule au loueur à la date prévue au contrat de location sous peine de s'exposer à des poursuites judiciaires civiles et pénales.
La durée de location est calculée par tranche de 24 heures non fractionnables depuis l'heure exacte de mise à disposition du véhicule mais vous bénéficiez toutefois d'une tolérance de 2 heures à la fin de la location avant qu'une nouvelle période de 24 heures soit appliquée.
Si vous souhaitez conserver le véhicule au-delà de la durée prévue au contrat :

Il vous appartiendra de vous rendre préalablement dans l'agence ${companyName}.

Et de régler le loyer et charges complémentaires à chaque fermeture du contrat de location.
Avant de pouvoir renouveler votre contrat.
Fin de location : la location se terminera par la restitution du véhicule, de ses clefs et de ses papiers au loueur. Dans le cas où le véhicule serait restitué sans ses clefs ou ses documents, le duplicata sera facturé au locataire ainsi que le fait que les clés sont indispensables pour tout.

Article 5 – ENTRETIEN ET RÉPARATION
L'usure mécanique normale est à la charge du loueur. Toutes les réparations provenant d'une usure anormale, soit d'une négligence de la part du locataire ou d'une cause accidentelle, seront à sa charge et exécutées par nos soins.
Dans le cas où le véhicule serait immobilisé en dehors de la région, les réparations quelles qu'elles soient dues à l'usure normale ou à une cause accidentelle ne seront exécutées qu'après accord télégraphique du loueur ou l'agent régional de la marque du véhicule.
Elles devront faire l'objet d'une facture acquittée et très détaillée. Les pièces défectueuses remplacées devront être présentées avec la facture acquittée.
En aucun cas et en aucune circonstance, le locataire ne pourra réclamer des dommages et intérêts, soit pour retard de la remise de la voiture ou annulation de la location, soit pour immobilisation dans les cas de réparations nécessitée par l'usure normale effectuée au cours de la location.

Article 6 – DOCUMENTS DU VÉHICULE
Le locataire s'engage, dès la fin de la location, à restituer tous les documents nécessaires à la circulation du véhicule. À défaut, ces pièces étant indispensables à de nouvelles locations, ${companyName} se verra dans l'obligation de facturer au locataire les journées de retard jusqu'à la remise des documents manquants.

Article 7 – PROLONGATION
Si le locataire, après avoir pris possession de la voiture, désire apporter des modifications, pour prolonger le période de location, il devra avertir 24 heures à l'avance.
L'accord final ne pourra lui être donné que par le chef de parc ; autrement toute modification sera impossible.

Article 8 – DÉLITS ET CONTRAVENTIONS
Pendant toute durée de la location, le locataire sera responsable de tout délit ou contravention relevés à son encontre.

Article 9 – ASSURANCES ET ACCIDENT
Le locataire déclare avoir pris connaissance des conditions générales au certificat d'assurance automobile mis à sa disposition.
En cas d'accident, un constat est obligatoire.

Article 10 – DÉPÔT DE GARANTIE
Le dépôt de garantie est destiné à couvrir les dommages pouvant survenir en cours de location et les éventuels compléments de facturation. Le dépôt doit être au moins égal au montant de la franchise non rachetable. Le montant de la franchise varie en fonction du type du véhicule loué.
La carte bancaire avant servir au paiement peut faire l'objet d'une prise d'empreinte.
Le client peut fournir les éléments suivants au titre de la garantie de paiement : espèces, chèque, empreinte de carte bancaire.

Article 11 – LIVRAISON / RESTITUTION
${companyName} vous offre le choix de l'endroit où vous souhaitez prendre ou rendre le véhicule (aéroport, hôtel, gare, centre-ville, etc.).

EN CAS DE LITIGES, SEUL LE TRIBUNAL DE ${companyCity.toUpperCase()} EST COMPÉTENT.
  `.trim();

  const lines = doc.splitTextToSize(conditions, contentWidth);

  lines.forEach((line: string) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(line, margin, yPosition);
    yPosition += 4;
  });

  return doc.output("blob");
}
