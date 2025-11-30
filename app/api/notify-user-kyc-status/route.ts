import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, nom, prenom, status, reason } = await request.json();

    // Email pour KYC VALIDÉ
    if (status === "verified") {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .button { display: inline-block; padding: 14px 28px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✅ KYC Validé !</h1>
              <p style="margin: 10px 0 0 0;">SIIIIIR RENT</p>
            </div>
            
            <div class="content">
              <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
              
              <div class="success-box">
                <h2 style="margin: 0 0 10px 0; color: #059669;">🎉 Félicitations !</h2>
                <p style="margin: 0;">Votre identité a été vérifiée avec succès. Vous pouvez maintenant profiter pleinement de SIIIIIR RENT !</p>
              </div>

              <p><strong>Ce que vous pouvez faire maintenant :</strong></p>
              <ul>
                <li>✅ Louer des véhicules en toute confiance</li>
                <li>✅ Accéder à l'ensemble de notre flotte</li>
                <li>✅ Bénéficier de réservations prioritaires</li>
              </ul>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
                  Accéder à mon dashboard
                </a>
              </div>

              <p style="margin-top: 30px;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
              
              <p>Cordialement,<br><strong>L'équipe SIIIIIR RENT</strong></p>
            </div>

            <div class="footer">
              <p>© ${new Date().getFullYear()} SIIIIIR RENT - Tous droits réservés</p>
              <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        from: "SIIIIIR RENT <noreply@siiiiirrent.com>",
        to: email,
        subject: "✅ Votre identité a été vérifiée - SIIIIIR RENT",
        html: emailHtml,
      });
    }

    // Email pour KYC REFUSÉ
    if (status === "rejected") {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .warning-box { background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
            .reason-box { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .button { display: inline-block; padding: 14px 28px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚠️ Vérification KYC</h1>
              <p style="margin: 10px 0 0 0;">SIIIIIR RENT</p>
            </div>
            
            <div class="content">
              <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
              
              <div class="warning-box">
                <h2 style="margin: 0 0 10px 0; color: #dc2626;">Documents non conformes</h2>
                <p style="margin: 0;">Nous n'avons malheureusement pas pu valider vos documents d'identité.</p>
              </div>

              ${
                reason
                  ? `
              <div class="reason-box">
                <p style="margin: 0; font-weight: bold; color: #374151;">Raison du refus :</p>
                <p style="margin: 10px 0 0 0; color: #6b7280;">${reason}</p>
              </div>
              `
                  : ""
              }

              <p><strong>Que faire maintenant ?</strong></p>
              <ul>
                <li>📸 Vérifiez que vos photos sont nettes et lisibles</li>
                <li>📄 Assurez-vous que vos documents sont valides</li>
                <li>🔄 Soumettez à nouveau vos documents depuis votre profil</li>
              </ul>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
                  Soumettre de nouveaux documents
                </a>
              </div>

              <p style="margin-top: 30px;">Notre équipe reste à votre disposition pour toute question.</p>
              
              <p>Cordialement,<br><strong>L'équipe SIIIIIR RENT</strong></p>
            </div>

            <div class="footer">
              <p>© ${new Date().getFullYear()} SIIIIIR RENT - Tous droits réservés</p>
              <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await resend.emails.send({
        from: "SIIIIIR RENT <noreply@siiiiirrent.com>",
        to: email,
        subject: "⚠️ Documents à revoir - SIIIIIR RENT",
        html: emailHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur envoi email KYC:", error);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}
