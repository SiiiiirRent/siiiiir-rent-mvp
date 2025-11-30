import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { nom, prenom, email, role, userId } = await request.json();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .badge { display: inline-block; padding: 8px 16px; background: #fef3c7; color: #92400e; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .button { display: inline-block; padding: 14px 28px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔔 Nouvelle Inscription</h1>
            <p style="margin: 10px 0 0 0;">SIIIIIR RENT - Dashboard Admin</p>
          </div>
          
          <div class="content">
            <h2>👤 Nouvel utilisateur en attente de validation</h2>
            
            <div class="info-box">
              <p><strong>Nom complet :</strong> ${prenom} ${nom}</p>
              <p><strong>Email :</strong> ${email}</p>
              <p><strong>Type de compte :</strong> <span class="badge">${role === "loueur" ? "💼 LOUEUR" : "🚗 LOCATAIRE"}</span></p>
              <p><strong>ID utilisateur :</strong> <code>${userId}</code></p>
            </div>

            <p style="margin: 20px 0;">Cet utilisateur a fourni ses documents d'identité (CIN/Passeport + Permis de conduire) et attend la validation de son compte.</p>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard" class="button">
                🔍 Voir le Dashboard Admin
              </a>
            </div>

            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; color: #1e40af;"><strong>⚡ Action requise :</strong></p>
              <p style="margin: 5px 0 0 0; color: #1e40af;">Vérifiez les documents et validez le compte depuis le dashboard admin.</p>
            </div>
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
      to: "admin@siiiiirrent.com",
      subject: `🔔 Nouvelle inscription : ${prenom} ${nom} (${role})`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur envoi email admin:", error);
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 });
  }
}
