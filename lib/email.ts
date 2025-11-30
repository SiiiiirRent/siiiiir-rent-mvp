// lib/email.ts
import { Resend } from "resend";

// =======================
// Initialisation Resend
// =======================

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error("❌ RESEND_API_KEY est manquante dans .env.local !");
}

const resend = apiKey ? new Resend(apiKey) : null;

const FROM_EMAIL = "contact@siiiiirrent.com";
const FROM_NAME = "SIIIIIR Rent";

// =======================
// Helper générique
// =======================

async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  context: string
): Promise<{ success: boolean; error?: any; response?: any }> {
  if (!resend) {
    const errorMsg = "RESEND_API_KEY manquante – impossible d'envoyer l'email";
    console.error(`❌ ${context} → ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const recipients = Array.isArray(to) ? to : [to];

  console.log(`📧 [${context}] → Envoi email`);
  console.log(`    → Destinataire(s):`, recipients);
  console.log(`    → Sujet: ${subject}`);

  try {
    const response = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: recipients,
      subject,
      html,
    });

    console.log(`✅ [${context}] Email envoyé à:`, recipients);
    return { success: true, response };
  } catch (error) {
    console.error(`❌ [${context}] Erreur envoi email:`, error);
    return { success: false, error };
  }
}

// =======================
// 1) Email nouvelle réservation au loueur
// =======================

export async function sendNewReservationEmailToOwner(params: {
  ownerEmail: string;
  ownerName: string;
  renterName: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  reservationId: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #22c55e;">Nouvelle réservation !</h1>
      
      <p>Bonjour ${params.ownerName},</p>
      <p>Bonne nouvelle ! Vous avez reçu une nouvelle réservation pour votre véhicule.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">📋 Détails de la réservation</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>🚗 Véhicule :</strong> ${params.vehicleName}</li>
          <li><strong>👤 Locataire :</strong> ${params.renterName}</li>
          <li><strong>📅 Du :</strong> ${params.startDate}</li>
          <li><strong>📅 Au :</strong> ${params.endDate}</li>
          <li><strong>💰 Montant total :</strong> ${params.totalPrice} MAD</li>
          <li><strong>ID réservation :</strong> ${params.reservationId}</li>
        </ul>
      </div>
      
      <p>Connectez-vous à votre espace pour voir tous les détails et gérer cette réservation.</p>
      
      <a href="https://siiiiirrent.com/dashboard/reservations" 
        style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Voir la réservation
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Merci de faire confiance à SIIIIIR Rent !<br>
        L'équipe SIIIIIR Rent
      </p>
    </div>
  `;

  return sendEmail(
    params.ownerEmail,
    `🎉 Nouvelle réservation pour votre ${params.vehicleName}`,
    html,
    "Email nouvelle réservation (loueur)"
  );
}

// =======================
// 2) Email confirmation au locataire
// =======================

export async function sendReservationConfirmationToRenter(params: {
  renterEmail: string;
  renterName: string;
  ownerName: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  reservationId: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #22c55e;">Réservation enregistrée ✅</h1>
      
      <p>Bonjour ${params.renterName},</p>
      <p>Votre demande de réservation a bien été enregistrée. Le propriétaire du véhicule va la confirmer sous peu.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">📋 Récapitulatif de votre réservation</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>🚗 Véhicule :</strong> ${params.vehicleName}</li>
          <li><strong>👤 Propriétaire :</strong> ${params.ownerName}</li>
          <li><strong>📅 Du :</strong> ${params.startDate}</li>
          <li><strong>📅 Au :</strong> ${params.endDate}</li>
          <li><strong>💰 Montant total :</strong> ${params.totalPrice} MAD</li>
          <li><strong>ID réservation :</strong> ${params.reservationId}</li>
        </ul>
      </div>
      
      <p>Vous recevrez un email lorsque le propriétaire aura confirmé la réservation.</p>
      
      <a href="https://siiiiirrent.com/espace-locataire" 
        style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Accéder à mon espace
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Merci d'avoir choisi SIIIIIR Rent !<br>
        L'équipe SIIIIIR Rent
      </p>
    </div>
  `;

  return sendEmail(
    params.renterEmail,
    `✅ Votre réservation - ${params.vehicleName}`,
    html,
    "Email confirmation (locataire)"
  );
}

// =======================
// 3) Email confirmation paiement (optionnel, future use)
// =======================

export async function sendPaymentConfirmationEmail(params: {
  recipientEmail: string;
  recipientName: string;
  amount: number;
  paymentMethod: string;
  vehicleName: string;
  reservationId: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #22c55e;">Paiement confirmé 💳</h1>
      
      <p>Bonjour ${params.recipientName},</p>
      <p>Nous vous confirmons la réception de votre paiement.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">💳 Détails du paiement</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>🚗 Véhicule :</strong> ${params.vehicleName}</li>
          <li><strong>💰 Montant :</strong> ${params.amount} MAD</li>
          <li><strong>💳 Méthode :</strong> ${params.paymentMethod}</li>
          <li><strong>ID réservation :</strong> ${params.reservationId}</li>
        </ul>
      </div>
      
      <p>Un reçu PDF est disponible dans votre espace.</p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Merci pour votre confiance,<br>
        L'équipe SIIIIIR Rent
      </p>
    </div>
  `;

  return sendEmail(
    params.recipientEmail,
    `💰 Paiement confirmé - ${params.amount} MAD`,
    html,
    "Email confirmation paiement"
  );
}

// =======================
/* 4) Email de rappel (optionnel, future automation) */
// =======================

export async function sendReminderEmail(params: {
  recipientEmail: string;
  recipientName: string;
  vehicleName: string;
  startDate: string;
  pickupLocation: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #f59e0b;">Rappel de location ⏰</h1>
      
      <p>Bonjour ${params.recipientName},</p>
      <p>Votre location commence bientôt. Voici un rappel :</p>
      
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <h3 style="margin-top: 0;">📅 ${params.startDate}</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>🚗 Véhicule :</strong> ${params.vehicleName}</li>
          <li><strong>📍 Lieu de prise en charge :</strong> ${params.pickupLocation}</li>
        </ul>
      </div>
      
      <p><strong>N'oubliez pas d'apporter :</strong></p>
      <ul>
        <li>✅ Votre permis de conduire</li>
        <li>✅ Votre carte d'identité</li>
        <li>✅ Le montant de la location (si non payé)</li>
      </ul>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Bonne location !<br>
        L'équipe SIIIIIR Rent
      </p>
    </div>
  `;

  return sendEmail(
    params.recipientEmail,
    "⏰ Rappel : Votre location commence bientôt",
    html,
    "Email rappel location"
  );
}

// =======================
// 5) Email annulation par le locataire (au loueur)
// =======================

export async function sendReservationCanceledByRenterEmail(params: {
  ownerEmail: string;
  ownerName?: string;
  renterName: string;
  renterEmail: string;
  reservationId: string;
  vehicleName?: string;
  startDate?: string;
  endDate?: string;
}) {
  console.log(
    "🔍 DEBUG sendReservationCanceledByRenterEmail params:",
    JSON.stringify(params, null, 2)
  );

  const {
    ownerEmail,
    ownerName,
    renterName,
    renterEmail,
    reservationId,
    vehicleName,
    startDate,
    endDate,
  } = params;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ef4444;">Réservation annulée par le locataire</h1>
      
      <p>Bonjour ${ownerName || "cher partenaire"},</p>
      <p>Le locataire <strong>${renterName}</strong> (${renterEmail}) a annulé la réservation suivante :</p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <h3 style="margin-top: 0;">📋 Détails de la réservation annulée</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>ID réservation :</strong> ${reservationId}</li>
          ${
            vehicleName
              ? `<li><strong>🚗 Véhicule :</strong> ${vehicleName}</li>`
              : ""
          }
          ${
            startDate && endDate
              ? `<li><strong>📅 Période :</strong> du ${startDate} au ${endDate}</li>`
              : ""
          }
        </ul>
      </div>
      
      <p>Vous pouvez consulter les détails dans votre tableau de bord SIIIIIR Rent.</p>
      
      <a href="https://siiiiirrent.com/dashboard/reservations" 
        style="display: inline-block; background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Ouvrir mon dashboard
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Merci pour votre confiance,<br>
        L'équipe SIIIIIR Rent
      </p>
    </div>
  `;

  return sendEmail(
    ownerEmail,
    `❌ Réservation annulée par le locataire - #${reservationId}`,
    html,
    "Email annulation réservation (locataire → loueur)"
  );
}

// =======================
// 6) Email annulation par le loueur (au locataire)
// =======================

export async function sendReservationCanceledByOwnerEmail(params: {
  renterEmail: string;
  renterName: string;
  ownerName?: string;
  reservationId: string;
  vehicleName?: string;
  startDate?: string;
  endDate?: string;
}) {
  const {
    renterEmail,
    renterName,
    ownerName,
    reservationId,
    vehicleName,
    startDate,
    endDate,
  } = params;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ef4444;">Réservation annulée par le propriétaire</h1>
      
      <p>Bonjour ${renterName},</p>
      <p>Le propriétaire <strong>${
        ownerName || "le loueur"
      }</strong> a annulé votre réservation.</p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <h3 style="margin-top: 0;">📋 Détails de la réservation annulée</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>ID réservation :</strong> ${reservationId}</li>
          ${
            vehicleName
              ? `<li><strong>🚗 Véhicule :</strong> ${vehicleName}</li>`
              : ""
          }
          ${
            startDate && endDate
              ? `<li><strong>📅 Période :</strong> du ${startDate} au ${endDate}</li>`
              : ""
          }
        </ul>
      </div>
      
      <p>Si vous avez déjà payé, merci de contacter le loueur pour les modalités de remboursement.</p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Nous restons à votre disposition pour toute nouvelle réservation,<br>
        L'équipe SIIIIIR Rent
      </p>
    </div>
  `;

  return sendEmail(
    renterEmail,
    `❌ Réservation annulée par le loueur - #${reservationId}`,
    html,
    "Email annulation réservation (loueur → locataire)"
  );
}
/**
 * Email check-in validé (au locataire)
 */
export async function sendCheckinValidatedEmail({
  renterEmail,
  renterName,
  vehicleName,
  startDate,
  endDate,
  pdfUrl,
}: {
  renterEmail: string;
  renterName: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  pdfUrl: string;
}) {
  try {
    if (!resend) {
      console.error("❌ Resend non initialisé");
      return { success: false, error: "Resend non initialisé" };
    }

    const { data, error } = await resend.emails.send({
      from: "SIIIIIR Rent <contact@siiiiirrent.com>",
      to: renterEmail,
      subject: `✅ Check-in validé - ${vehicleName} - SIIIIIR Rent`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .badge { background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a; }
              .button { background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">✅ Check-in validé !</h1>
              </div>
              
              <div class="content">
                <p style="font-size: 16px;">Bonjour <strong>${renterName}</strong>,</p>
                
                <p style="font-size: 16px;">
                  Le loueur a validé votre check-in ! Votre location est maintenant active.
                </p>

                <div class="badge">📋 État des lieux - ENTRÉE</div>

                <div class="info-box">
                  <p style="margin: 5px 0;"><strong>🚗 Véhicule :</strong> ${vehicleName}</p>
                  <p style="margin: 5px 0;"><strong>📅 Dates :</strong> ${startDate} → ${endDate}</p>
                </div>

                <p style="font-size: 16px;">
                  Profitez bien de votre location ! Conduisez prudemment.
                </p>

                <div style="text-align: center;">
                  <a href="${pdfUrl}" class="button">📄 Voir le PDF check-in</a>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  💡 <strong>Conseil :</strong> Prenez soin du véhicule et restituez-le dans le même état pour éviter tout litige.
                </p>
              </div>

              <div class="footer">
                <p>SIIIIIR Rent - La location de véhicules digitalisée</p>
                <p>www.siiiirrent.ma | contact@siiiiirrent.com</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Erreur envoi email check-in validé:", error);
      return { success: false, error };
    }

    console.log("✅ Email check-in validé envoyé à:", renterEmail);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Erreur email check-in validé:", error);
    return { success: false, error };
  }
}

/**
 * Email check-out validé (aux deux parties)
 */
export async function sendCheckoutValidatedEmail({
  recipientEmail,
  recipientName,
  vehicleName,
  distanceKm,
  pdfUrl,
  isOwner = false,
}: {
  recipientEmail: string;
  recipientName: string;
  vehicleName: string;
  distanceKm: number;
  pdfUrl: string;
  isOwner?: boolean;
}) {
  try {
    if (!resend) {
      console.error("❌ Resend non initialisé");
      return { success: false, error: "Resend non initialisé" };
    }

    const { data, error } = await resend.emails.send({
      from: "SIIIIIR Rent <contact@siiiiirrent.com>",
      to: recipientEmail,
      subject: `✅ Check-out validé - Location terminée - ${vehicleName} - SIIIIIR Rent`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .badge { background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a; }
              .button { background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">✅ Check-out validé !</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Location terminée avec succès</p>
              </div>
              
              <div class="content">
                <p style="font-size: 16px;">Bonjour <strong>${recipientName}</strong>,</p>
                
                <p style="font-size: 16px;">
                  ${isOwner ? "Le check-out a été validé avec succès. Le véhicule vous a été restitué." : "Votre location est maintenant terminée. Le check-out a été validé par le loueur."}
                </p>

                <div class="badge">📤 État des lieux - SORTIE</div>

                <div class="info-box">
                  <p style="margin: 5px 0;"><strong>🚗 Véhicule :</strong> ${vehicleName}</p>
                  <p style="margin: 5px 0;"><strong>📏 Distance parcourue :</strong> ${distanceKm} km</p>
                </div>

                <p style="font-size: 16px;">
                  ${isOwner ? "Merci d'avoir utilisé SIIIIIR Rent pour votre location !" : "Merci d'avoir choisi SIIIIIR Rent ! À bientôt pour une prochaine location."}
                </p>

                <div style="text-align: center;">
                  <a href="${pdfUrl}" class="button">📄 Voir le PDF check-out</a>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  💚 Merci de faire confiance à SIIIIIR Rent !
                </p>
              </div>

              <div class="footer">
                <p>SIIIIIR Rent - La location de véhicules digitalisée</p>
                <p>www.siiiirrent.ma | contact@siiiiirrent.com</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Erreur envoi email check-out validé:", error);
      return { success: false, error };
    }

    console.log("✅ Email check-out validé envoyé à:", recipientEmail);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Erreur email check-out validé:", error);
    return { success: false, error };
  }
}

/**
 * Email litige déclaré (au locataire)
 */
export async function sendLitigeDeclareeEmail({
  renterEmail,
  renterName,
  vehicleName,
  litigeReason,
  litigeMontant,
  pdfUrl,
}: {
  renterEmail: string;
  renterName: string;
  vehicleName: string;
  litigeReason: string;
  litigeMontant: number;
  pdfUrl: string;
}) {
  try {
    if (!resend) {
      console.error("❌ Resend non initialisé");
      return { success: false, error: "Resend non initialisé" };
    }

    const { data, error } = await resend.emails.send({
      from: "SIIIIIR Rent <contact@siiiiirrent.com>",
      to: renterEmail,
      subject: `⚠️ Litige déclaré - ${vehicleName} - SIIIIIR Rent`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .badge { background: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
              .warning-box { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
              .button { background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">⚠️ Litige déclaré</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Concernant votre location</p>
              </div>
              
              <div class="content">
                <p style="font-size: 16px;">Bonjour <strong>${renterName}</strong>,</p>
                
                <div class="warning-box">
                  <p style="font-size: 16px; margin: 0;">
                    ⚠️ Le loueur a déclaré un litige concernant la restitution du véhicule.
                  </p>
                </div>

                <div class="badge">🚨 LITIGE DÉCLARÉ</div>

                <div class="info-box">
                  <p style="margin: 5px 0;"><strong>🚗 Véhicule :</strong> ${vehicleName}</p>
                  <p style="margin: 10px 0 5px 0;"><strong>📝 Raison du litige :</strong></p>
                  <p style="margin: 5px 0; padding: 10px; background: #fef2f2; border-radius: 6px;">${litigeReason}</p>
                  <p style="margin: 10px 0 5px 0;"><strong>💰 Montant réclamé :</strong> <span style="font-size: 20px; color: #dc2626;">${litigeMontant} MAD</span></p>
                </div>

                <p style="font-size: 16px;">
                  Un responsable SIIIIIR Rent vous contactera sous <strong>24 heures</strong> pour examiner ce litige et trouver une solution équitable.
                </p>

                <div style="text-align: center;">
                  <a href="${pdfUrl}" class="button">📄 Voir le PDF check-out</a>
                </div>

                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    <strong>💡 Ce que vous devez faire :</strong><br>
                    • Vérifier le PDF check-out<br>
                    • Préparer vos explications<br>
                    • Attendre le contact de notre équipe
                  </p>
                </div>
              </div>

              <div class="footer">
                <p>SIIIIIR Rent - La location de véhicules digitalisée</p>
                <p>www.siiiirrent.ma | contact@siiiiirrent.com</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Erreur envoi email litige déclaré:", error);
      return { success: false, error };
    }

    console.log("✅ Email litige déclaré envoyé à:", renterEmail);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Erreur email litige déclaré:", error);
    return { success: false, error };
  }
}
