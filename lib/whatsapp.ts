// lib/whatsapp.ts

/**
 * Génère un lien WhatsApp avec message pré-rempli
 * Compatible mobile (iOS/Android) et desktop
 */

// ==========================================
// TYPES
// ==========================================

export interface WhatsAppVehicleShare {
  vehicleName: string;
  prixParJour: number;
  vehicleUrl: string;
}

export interface WhatsAppReservationShare {
  vehicleName: string;
  startDate: string; // Format "DD/MM/YYYY"
  endDate: string; // Format "DD/MM/YYYY"
  prixTotal: number;
  reservationUrl: string;
  contratPdfUrl?: string | null;
  renterName?: string;
}

export interface WhatsAppAgencyShare {
  agencyName: string;
  agencyUrl: string;
  description?: string;
}

// ==========================================
// GÉNÉRATEURS DE MESSAGES
// ==========================================

/**
 * Message pour partager un véhicule
 */
export function generateVehicleMessage(data: WhatsAppVehicleShare): string {
  return `السلام عليكم ! Bonjour ! 🚗

Voici notre véhicule disponible :
*${data.vehicleName}*

💰 Prix : ${data.prixParJour} DH / jour

📲 Réservez ici : ${data.vehicleUrl}`;
}

/**
 * Message pour partager une réservation
 */
export function generateReservationMessage(
  data: WhatsAppReservationShare
): string {
  let message = `السلام عليكم ${data.renterName ? data.renterName : "!"} 🚗

✅ Voici les détails de votre réservation :

🚙 Véhicule : *${data.vehicleName}*
📅 Dates : ${data.startDate} → ${data.endDate}
💰 Prix total : ${data.prixTotal} MAD

🔗 Détails : ${data.reservationUrl}`;

  if (data.contratPdfUrl) {
    message += `\n📄 Contrat : ${data.contratPdfUrl}`;
  }

  return message;
}

/**
 * Message pour partager la page agence
 */
export function generateAgencyMessage(data: WhatsAppAgencyShare): string {
  let message = `السلام عليكم ! Bonjour ! 🚗

${data.description || "Découvrez notre agence de location de voitures"}

*${data.agencyName}*

📲 Consultez nos véhicules et réservez en ligne :
${data.agencyUrl}`;

  return message;
}

// ==========================================
// GÉNÉRATEUR DE LIEN WHATSAPP
// ==========================================

/**
 * Génère un lien WhatsApp avec message pré-rempli
 * @param message - Le message à pré-remplir
 * @param phoneNumber - (Optionnel) Numéro de téléphone du destinataire
 * @returns URL WhatsApp complète
 */
export function generateWhatsAppLink(
  message: string,
  phoneNumber?: string
): string {
  const encodedMessage = encodeURIComponent(message);

  // Si numéro fourni : wa.me/212600000000?text=...
  // Sinon : wa.me/?text=... (ouvre WhatsApp sans destinataire)
  if (phoneNumber) {
    // Nettoyer le numéro (enlever espaces, tirets, +)
    const cleanNumber = phoneNumber.replace(/[\s\-\+]/g, "");
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  }

  return `https://wa.me/?text=${encodedMessage}`;
}

// ==========================================
// FONCTIONS HELPERS
// ==========================================

/**
 * Ouvre WhatsApp dans une nouvelle fenêtre/tab
 */
export function openWhatsApp(whatsappUrl: string): void {
  if (typeof window !== "undefined") {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }
}

/**
 * Génère l'URL complète d'un véhicule
 */
export function getVehicleUrl(vehicleId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/vehicules/${vehicleId}`;
  }
  return `https://siiiirrent.ma/vehicules/${vehicleId}`;
}

/**
 * Génère l'URL complète d'une réservation (PAGE PUBLIQUE)
 */
export function getReservationUrl(reservationId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/reservation/${reservationId}`; // ✅ MODIFIÉ
  }
  return `https://siiiirrent.ma/reservation/${reservationId}`; // ✅ MODIFIÉ
}

/**
 * Génère l'URL complète d'une agence loueur
 */
export function getAgencyUrl(loueurId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/loueur/${loueurId}`;
  }
  return `https://siiiirrent.ma/loueur/${loueurId}`;
}
