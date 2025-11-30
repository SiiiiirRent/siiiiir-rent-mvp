/**
 * lib/users.ts
 * Logique métier pour la gestion des utilisateurs
 * Architecture SaaS : séparation logique métier / UI
 */

import { db, storage } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { UserProfile, UserProfileUpdate } from "./types";

/**
 * Récupérer le profil complet d'un utilisateur
 * Crée automatiquement le profil s'il n'existe pas
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log("⚠️ Profil introuvable, création automatique...");

      // Récupérer l'utilisateur connecté depuis Firebase Auth
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error("Utilisateur non connecté");
        return null;
      }

      // Créer le profil de base
      const newProfile = {
        email: currentUser.email || "",
        role: "loueur",
        photoURL: "",
        nom: "",
        prenom: "",
        telephone: "",
        adresse: "",
        ville: "",
        codePostal: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Créer le document dans Firestore
      await setDoc(userRef, newProfile);

      console.log("✅ Profil créé automatiquement !");

      // Recharger le profil
      const newUserSnap = await getDoc(userRef);
      return { uid, ...newUserSnap.data() } as UserProfile;
    }

    return { uid, ...userSnap.data() } as UserProfile;
  } catch (error) {
    console.error("Erreur getUserProfile:", error);
    throw error;
  }
}

/**
 * Mettre à jour le profil utilisateur
 */
export async function updateUserProfile(
  uid: string,
  updates: UserProfileUpdate
): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Profil mis à jour avec succès");
  } catch (error) {
    console.error("❌ Erreur updateUserProfile:", error);
    throw error;
  }
}

/**
 * Upload photo de profil
 * Stockage : /users/{uid}/profile/photo.jpg
 */
export async function uploadProfilePhoto(
  uid: string,
  file: File
): Promise<string> {
  try {
    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("La photo est trop grande (max 5MB)");
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      throw new Error("Le fichier doit être une image");
    }

    // Créer une référence Storage unique
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `photo_${timestamp}.${fileExtension}`;
    const storageRef = ref(storage, `users/${uid}/profile/${fileName}`);

    console.log("📤 Upload photo profil...");

    // Upload
    await uploadBytes(storageRef, file);

    // Récupérer l'URL publique
    const photoURL = await getDownloadURL(storageRef);

    // Mettre à jour le profil utilisateur
    await updateUserProfile(uid, { photoURL });

    console.log("✅ Photo de profil uploadée:", photoURL);
    return photoURL;
  } catch (error) {
    console.error("❌ Erreur uploadProfilePhoto:", error);
    throw error;
  }
}

/**
 * Supprimer la photo de profil
 */
export async function deleteProfilePhoto(uid: string): Promise<void> {
  try {
    // Récupérer le profil pour avoir l'URL de la photo
    const profile = await getUserProfile(uid);

    if (!profile?.photoURL) {
      console.log("Aucune photo à supprimer");
      return;
    }

    // Supprimer du Storage
    try {
      const photoRef = ref(storage, profile.photoURL);
      await deleteObject(photoRef);
      console.log("✅ Photo supprimée du Storage");
    } catch (storageError) {
      console.warn("Photo Storage déjà supprimée ou introuvable");
    }

    // Mettre à jour Firestore
    await updateUserProfile(uid, { photoURL: "" });

    console.log("✅ Photo de profil supprimée");
  } catch (error) {
    console.error("❌ Erreur deleteProfilePhoto:", error);
    throw error;
  }
}

/**
 * Upload document KYC (CNI ou Permis)
 * Stockage : /users/{uid}/kyc/{typeDoc}/{side}_{timestamp}.jpg
 */
export async function uploadKYCDocument(
  uid: string,
  file: File,
  documentType: "cni" | "permis",
  side: "recto" | "verso"
): Promise<string> {
  try {
    // Vérifier la taille (max 10MB pour les documents)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Le document est trop grand (max 10MB)");
    }

    // Vérifier le type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      throw new Error("Le fichier doit être une image ou un PDF");
    }

    // Créer référence Storage
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${side}_${timestamp}.${fileExtension}`;
    const storageRef = ref(
      storage,
      `users/${uid}/kyc/${documentType}/${fileName}`
    );

    console.log(`📤 Upload ${documentType} ${side}...`);

    // Upload
    await uploadBytes(storageRef, file);

    // Récupérer URL
    const documentURL = await getDownloadURL(storageRef);

    // Mettre à jour Firestore
    const updatePath = `documents.${documentType}.${side}`;
    const updateData: any = {
      [updatePath]: documentURL,
      [`documents.${documentType}.uploadedAt`]: serverTimestamp(),
      [`documents.${documentType}.verified`]: false,
    };

    await updateUserProfile(uid, updateData);

    console.log(`✅ ${documentType} ${side} uploadé:`, documentURL);
    return documentURL;
  } catch (error) {
    console.error(`❌ Erreur upload ${documentType}:`, error);
    throw error;
  }
}

/**
 * Supprimer un document KYC
 */
export async function deleteKYCDocument(
  uid: string,
  documentType: "cni" | "permis",
  side: "recto" | "verso"
): Promise<void> {
  try {
    // Récupérer le profil
    const profile = await getUserProfile(uid);

    const documentURL = profile?.documents?.[documentType]?.[side];

    if (!documentURL) {
      console.log(`Aucun document ${documentType} ${side} à supprimer`);
      return;
    }

    // Supprimer du Storage
    try {
      const docRef = ref(storage, documentURL);
      await deleteObject(docRef);
      console.log(`✅ Document ${documentType} ${side} supprimé du Storage`);
    } catch (storageError) {
      console.warn("Document Storage déjà supprimé ou introuvable");
    }

    // Mettre à jour Firestore
    const updatePath = `documents.${documentType}.${side}`;
    const updateData: any = {
      [updatePath]: "",
    };

    await updateUserProfile(uid, updateData);

    console.log(`✅ Document ${documentType} ${side} supprimé`);
  } catch (error) {
    console.error(`❌ Erreur suppression ${documentType}:`, error);
    throw error;
  }
}

/**
 * Soumettre les documents KYC pour vérification
 */
export async function submitKYCForVerification(uid: string): Promise<void> {
  try {
    const profile = await getUserProfile(uid);

    // Vérifier que tous les documents sont uploadés
    const hasCNI =
      profile?.documents?.cni?.recto && profile?.documents?.cni?.verso;
    const hasPermis =
      profile?.documents?.permis?.recto && profile?.documents?.permis?.verso;

    if (!hasCNI || !hasPermis) {
      throw new Error(
        "Veuillez uploader tous les documents (CNI recto/verso + Permis recto/verso)"
      );
    }

    // Mettre à jour le statut KYC
    await updateUserProfile(uid, {
      kycStatus: "submitted",
    });

    console.log("✅ Documents KYC soumis pour vérification");
  } catch (error) {
    console.error("❌ Erreur soumission KYC:", error);
    throw error;
  }
}
/**
 * 🆕 Upload document société (Patente ou Registre Commerce)
 * Stockage : /users/{uid}/company/{docType}.pdf
 */
export async function uploadCompanyDocument(
  uid: string,
  file: File,
  documentType: "patente" | "registreCommerce"
): Promise<string> {
  try {
    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Le document est trop grand (max 10MB)");
    }

    // Vérifier le type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      throw new Error("Le fichier doit être une image ou un PDF");
    }

    // Créer référence Storage
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${documentType}_${timestamp}.${fileExtension}`;
    const storageRef = ref(storage, `users/${uid}/company/${fileName}`);

    console.log(`📤 Upload ${documentType}...`);

    // Upload
    await uploadBytes(storageRef, file);

    // Récupérer URL
    const documentURL = await getDownloadURL(storageRef);

    // Mettre à jour Firestore
    const fieldName =
      documentType === "patente" ? "patentePDF" : "registreCommercePDF";
    const updateData: any = {
      [`companyInfo.documents.${fieldName}.url`]: documentURL,
      [`companyInfo.documents.${fieldName}.uploadedAt`]: serverTimestamp(),
      [`companyInfo.documents.${fieldName}.verified`]: false,
    };

    await updateUserProfile(uid, updateData);

    console.log(`✅ ${documentType} uploadé:`, documentURL);
    return documentURL;
  } catch (error) {
    console.error(`❌ Erreur upload ${documentType}:`, error);
    throw error;
  }
}

/**
 * 🆕 Supprimer un document société
 */
export async function deleteCompanyDocument(
  uid: string,
  documentType: "patente" | "registreCommerce"
): Promise<void> {
  try {
    // Récupérer le profil
    const profile = await getUserProfile(uid);

    const fieldName =
      documentType === "patente" ? "patentePDF" : "registreCommercePDF";
    const documentURL = profile?.companyInfo?.documents?.[fieldName]?.url;

    if (!documentURL) {
      console.log(`Aucun document ${documentType} à supprimer`);
      return;
    }

    // Supprimer du Storage
    try {
      const docRef = ref(storage, documentURL);
      await deleteObject(docRef);
      console.log(`✅ Document ${documentType} supprimé du Storage`);
    } catch (storageError) {
      console.warn("Document Storage déjà supprimé ou introuvable");
    }

    // Mettre à jour Firestore
    const updateData: any = {
      [`companyInfo.documents.${fieldName}.url`]: "",
    };

    await updateUserProfile(uid, updateData);

    console.log(`✅ Document ${documentType} supprimé`);
  } catch (error) {
    console.error(`❌ Erreur suppression ${documentType}:`, error);
    throw error;
  }
}
