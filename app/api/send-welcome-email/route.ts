import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, nom, prenom, role } = await request.json();

    const { data, error } = await resend.emails.send({
      from: "SIIIIIR Rent <contact@siiiiirrent.com>",
      to: email,
      subject: "Bienvenue sur SIIIIIR Rent ! 🚀",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #16a34a;
              }
              .button {
                display: inline-block;
                background: #16a34a;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
              }
              .emoji {
                font-size: 48px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Bienvenue sur SIIIIIR Rent !</h1>
            </div>
            
            <div class="content">
              <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
              
              <p>Votre compte <strong>${role === "locataire" ? "Locataire" : "Loueur"}</strong> a été créé avec succès ! 🚀</p>
              
              <div class="card">
                <div class="emoji">${role === "locataire" ? "🚗" : "💼"}</div>
                <h2>Prochaines étapes :</h2>
                <ul>
                  <li>✅ Votre compte est en cours de vérification</li>
                  <li>⏰ Validation sous 24h par notre équipe</li>
                  <li>📧 Vous recevrez un email de confirmation</li>
                  ${
                    role === "loueur"
                      ? "<li>🚙 Vous pourrez ensuite ajouter vos véhicules</li>"
                      : "<li>🔍 Vous pourrez ensuite réserver des véhicules</li>"
                  }
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" class="button">
                  Accéder à mon espace
                </a>
              </div>
              
              <div class="card">
                <h3>📋 Rappel de vos informations :</h3>
                <ul>
                  <li><strong>Email :</strong> ${email}</li>
                  <li><strong>Rôle :</strong> ${role === "locataire" ? "Locataire" : "Loueur"}</li>
                </ul>
              </div>
              
              <p style="margin-top: 30px;">
                <strong>Besoin d'aide ?</strong><br>
                Contactez-nous à <a href="mailto:support@siiiirrent.com">support@siiiirrent.com</a>
              </p>
            </div>
            
            <div class="footer">
              <p>© 2025 SIIIIIR Rent - Location de véhicules au Maroc</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Erreur envoi email:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}
