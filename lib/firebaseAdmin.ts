import admin from "firebase-admin";

// 🔍 Debug : Vérifier les variables d'environnement
console.log("🔍 Vérification des variables Firebase Admin...");
console.log(
  "FIREBASE_PROJECT_ID:",
  process.env.FIREBASE_PROJECT_ID ? "✅ OK" : "❌ MANQUANT"
);
console.log(
  "FIREBASE_CLIENT_EMAIL:",
  process.env.FIREBASE_CLIENT_EMAIL ? "✅ OK" : "❌ MANQUANT"
);
console.log(
  "FIREBASE_PRIVATE_KEY:",
  process.env.FIREBASE_PRIVATE_KEY
    ? `✅ OK (${process.env.FIREBASE_PRIVATE_KEY.substring(0, 50)}...)`
    : "❌ MANQUANT"
);
console.log(
  "FIREBASE_STORAGE_BUCKET:",
  process.env.FIREBASE_STORAGE_BUCKET ? "✅ OK" : "❌ MANQUANT"
);

// Vérifier que toutes les variables existent
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY ||
  !process.env.FIREBASE_STORAGE_BUCKET
) {
  throw new Error("❌ Variables Firebase Admin manquantes dans .env.local");
}

// Initialiser Firebase Admin (une seule fois)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log("✅ Firebase Admin initialisé avec succès");
  } catch (error) {
    console.error("❌ Erreur initialisation Firebase Admin:", error);
    throw error;
  }
}

// Exporter les services
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export const adminAuth = admin.auth();

// Vérifier que les exports sont bien définis
console.log("📦 adminDb:", adminDb ? "✅ OK" : "❌ UNDEFINED");
console.log("📦 adminStorage:", adminStorage ? "✅ OK" : "❌ UNDEFINED");
console.log("📦 adminAuth:", adminAuth ? "✅ OK" : "❌ UNDEFINED");
