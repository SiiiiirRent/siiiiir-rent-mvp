import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { generateContractPDF } from "@/lib/generateContractPDF";
import { Reservation, ContractSettings } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { reservationId, renterSignatureBase64 } = await req.json();

    console.log("🔄 [API] Régénération PDF pour →", reservationId);

    if (!reservationId || !renterSignatureBase64) {
      return NextResponse.json(
        { success: false, error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // 1) Charger la réservation complète
    const reservationRef = doc(db, "reservations", reservationId);
    const reservationSnap = await getDoc(reservationRef);

    if (!reservationSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Réservation introuvable" },
        { status: 404 }
      );
    }

    const reservationData = {
      id: reservationSnap.id,
      ...reservationSnap.data(),
    } as Reservation;

    console.log("📄 Données réservation chargées");

    // 2) Récupérer signature loueur (déjà enregistrée)
    const ownerSignatureBase64 =
      (reservationData as any).ownerSignature ||
      (reservationData as any).contract?.ownerSignatureBase64;

    console.log("🖊️ Signatures disponibles:", {
      owner: ownerSignatureBase64 ? "✅" : "❌",
      renter: renterSignatureBase64 ? "✅" : "❌",
    });

    // 3) ✅ CHARGER LES CONTRACT SETTINGS
    let contractSettings: ContractSettings | undefined;
    try {
      const settingsDoc = await getDoc(
        doc(db, "users", reservationData.loueurId, "settings", "contract")
      );
      if (settingsDoc.exists()) {
        contractSettings = settingsDoc.data() as ContractSettings;
        console.log("✅ Contract settings chargés");
      }
    } catch (error) {
      console.warn("⚠️ Impossible de charger contract settings:", error);
    }

    // 4) Récupérer infos loueur depuis Firestore users (fallback)
    let loueurNom = (reservationData as any).ownerName || "Propriétaire";
    let loueurTel = "";
    let loueurAdresse = "";
    let loueurEmail = "";
    let loueurSociete = "";
    let loueurVille = "";
    let loueurPays = "";

    try {
      const loueurDoc = await getDoc(
        doc(db, "users", reservationData.loueurId)
      );
      if (loueurDoc.exists()) {
        const loueurData = loueurDoc.data();

        // Nom du loueur
        loueurNom =
          loueurData.displayName ||
          `${loueurData.prenom || ""} ${loueurData.nom || ""}`.trim() ||
          loueurNom;

        // Infos depuis companyInfo ou racine
        const companyInfo = loueurData.companyInfo || {};

        loueurTel = companyInfo.telephoneSociete || loueurData.telephone || "";
        loueurAdresse = companyInfo.adresseSociete || loueurData.adresse || "";
        loueurEmail = loueurData.email || "";
        loueurSociete = companyInfo.nomSociete || "";
        loueurVille = companyInfo.villeSociete || loueurData.ville || "";
        loueurPays = loueurData.pays || "";

        console.log("📋 Infos loueur récupérées:", {
          nom: loueurNom,
          societe: loueurSociete,
          tel: loueurTel,
          adresse: loueurAdresse,
          ville: loueurVille,
          pays: loueurPays,
          email: loueurEmail,
        });
      }
    } catch (error) {
      console.warn("⚠️ Impossible de charger infos loueur:", error);
    }

    // 5) Générer le nouveau PDF avec LES DEUX signatures + contract settings
    console.log("📝 Génération PDF avec les 2 signatures...");

    const pdfBlob = await generateContractPDF({
      reservation: reservationData,
      loueurNom,
      loueurTel,
      loueurAdresse,
      loueurEmail,
      loueurSociete,
      loueurVille,
      loueurPays,
      ownerSignatureBase64,
      renterSignatureBase64,
      contractSettings, // ✅ Passé ici
    });

    console.log("✅ PDF généré, taille:", pdfBlob.size, "bytes");

    // 6) Upload le nouveau PDF sur Firebase Storage
    const storageRef = ref(
      storage,
      `contracts/${reservationId}_${Date.now()}.pdf`
    );

    await uploadBytes(storageRef, pdfBlob);
    const newContractUrl = await getDownloadURL(storageRef);

    console.log("✅ Nouveau PDF uploadé:", newContractUrl);

    // 7) Mettre à jour Firestore avec la nouvelle URL
    await updateDoc(reservationRef, {
      "contract.url": newContractUrl,
      "contract.signedByRenter": true,
      "contract.renterSignatureBase64": renterSignatureBase64,
      "contract.fullySignedAt": new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Firestore mis à jour avec nouvelle URL PDF");

    return NextResponse.json({
      success: true,
      contractUrl: newContractUrl,
    });
  } catch (error) {
    console.error("❌ ERREUR régénération PDF:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
