"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { Eye, EyeOff, Upload, X } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  // États formulaire
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [ville, setVille] = useState("");
  const [pays, setPays] = useState("Maroc");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // État pour le rôle
  const [role, setRole] = useState<"loueur" | "locataire">("locataire");

  // Pièces d'identité
  const [numeroCIN, setNumeroCIN] = useState("");
  const [photosCIN, setPhotosCIN] = useState<File[]>([]);
  const [numeroPermis, setNumeroPermis] = useState("");
  const [dateValiditePermis, setDateValiditePermis] = useState("");
  const [photosPermis, setPhotosPermis] = useState<File[]>([]);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const handlePhotosCINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 2);
      setPhotosCIN(filesArray);
    }
  };

  const handlePhotosPermisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 2);
      setPhotosPermis(filesArray);
    }
  };

  const removePhotoCIN = (index: number) => {
    setPhotosCIN(photosCIN.filter((_, i) => i !== index));
  };

  const removePhotoPermis = (index: number) => {
    setPhotosPermis(photosPermis.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    if (!nom.trim()) {
      setError("Le nom est requis");
      return false;
    }
    if (!prenom.trim()) {
      setError("Le prénom est requis");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Email invalide");
      return false;
    }
    if (!telephone.trim() || telephone.length < 10) {
      setError("Numéro de téléphone invalide");
      return false;
    }
    if (!password || password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!adresse.trim()) {
      setError("L'adresse est requise");
      return false;
    }
    if (!ville.trim()) {
      setError("La ville est requise");
      return false;
    }
    if (!pays.trim()) {
      setError("Le pays est requis");
      return false;
    }
    if (!numeroCIN.trim()) {
      setError("Le numéro de CIN/Passeport est requis");
      return false;
    }
    if (photosCIN.length === 0) {
      setError("Veuillez uploader au moins une photo de votre CIN (recto)");
      return false;
    }
    if (!numeroPermis.trim()) {
      setError("Le numéro de permis est requis");
      return false;
    }
    if (!dateValiditePermis) {
      setError("La date de validité du permis est requise");
      return false;
    }
    if (photosPermis.length === 0) {
      setError("Veuillez uploader au moins une photo de votre permis");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError("");
    if (validateStep1()) {
      setStep(2);
    }
  };

  const uploadPhotos = async (
    userId: string,
    files: File[],
    type: "cin" | "permis"
  ): Promise<string[]> => {
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${type}_${i}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `users/${userId}/${type}/${fileName}`);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }

    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateStep2()) {
      return;
    }

    try {
      setLoading(true);

      // 1. Créer compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. Uploader les photos
      console.log("📤 Upload photos CIN...");
      const cinUrls = await uploadPhotos(user.uid, photosCIN, "cin");

      console.log("📤 Upload photos permis...");
      const permisUrls = await uploadPhotos(user.uid, photosPermis, "permis");

      // 3. ✅ Créer profil Firestore avec structure correcte
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: `${prenom} ${nom}`,
        nom,
        prenom,
        telephone,
        adresse,
        ville,
        pays,
        numeroCIN,
        numeroPermis,
        dateValiditePermis: new Date(dateValiditePermis),

        // ✅ Structure documents détaillée
        documents: {
          cni: {
            recto: cinUrls[0] || "",
            verso: cinUrls[1] || "",
            verified: false,
            uploadedAt: Timestamp.now(),
          },
          permis: {
            recto: permisUrls[0] || "",
            verso: permisUrls[1] || "",
            verified: false,
            uploadedAt: Timestamp.now(),
          },
        },

        // ✅ Champs à plat pour ton Profil (cinPhotoURL / permisPhotoURL)
        cinPhotoURL: cinUrls[0] || "",
        permisPhotoURL: permisUrls[0] || "",

        role: role,
        profileCompleted: true,
        isVerified: false,
        kycStatus: "pending", // 🔥 Statut KYC en attente
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 4. Mettre à jour displayName
      await updateProfile(user, {
        displayName: `${prenom} ${nom}`,
      });

      console.log("✅ Inscription réussie");

      // 5. ✅ ENVOYER L'EMAIL DE BIENVENUE
      try {
        await fetch("/api/send-welcome-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            nom: nom,
            prenom: prenom,
            role: role,
          }),
        });
        console.log("📧 Email de bienvenue envoyé");
      } catch (emailError) {
        console.error("⚠️ Erreur envoi email:", emailError);
      }

      // 6. 🔥 NOTIFIER L'ADMIN
      try {
        await fetch("/api/notify-admin-new-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nom: nom,
            prenom: prenom,
            email: email,
            role: role,
            userId: user.uid,
          }),
        });
        console.log("📧 Admin notifié de la nouvelle inscription");
      } catch (emailError) {
        console.error("⚠️ Erreur notification admin:", emailError);
      }

      // 7. ✅ FORCER LE RECHARGEMENT DE LA SESSION
      await user.reload();

      // 8. ✅ ATTENDRE UN PETIT DÉLAI POUR QUE FIRESTORE SE SYNCHRONISE
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("✅ Inscription réussie ! Consultez votre email de bienvenue 📧");
      window.location.href = "/dashboard"; // ✅ Rechargement complet
    } catch (error: any) {
      console.error("❌ Erreur inscription:", error);

      if (error.code === "auth/email-already-in-use") {
        setError("Cet email est déjà utilisé");
      } else if (error.code === "auth/weak-password") {
        setError("Le mot de passe est trop faible");
      } else {
        setError("Erreur lors de l'inscription : " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold">
              SIIIIIR <span className="text-green-600">RENT</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-600 mt-2">
            Devenez loueur en quelques minutes
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-sm font-medium ${
                step === 1 ? "text-green-600" : "text-gray-400"
              }`}
            >
              Étape 1 : Compte
            </span>
            <span
              className={`text-sm font-medium ${
                step === 2 ? "text-green-600" : "text-gray-400"
              }`}
            >
              Étape 2 : Identité
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: step === 1 ? "50%" : "100%" }}
            ></div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ÉTAPE 1 : Informations compte */}
          {step === 1 && (
            <form className="space-y-4">
              {/* SÉLECTION DU RÔLE */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Je souhaite *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Option Locataire */}
                  <button
                    type="button"
                    onClick={() => setRole("locataire")}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      role === "locataire"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-300 hover:border-green-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🚗</span>
                      {role === "locataire" && (
                        <span className="text-green-600 text-xl">✓</span>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900">
                      Louer un véhicule
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Je recherche un véhicule à louer
                    </div>
                  </button>

                  {/* Option Loueur */}
                  <button
                    type="button"
                    onClick={() => setRole("loueur")}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      role === "loueur"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-300 hover:border-green-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">💼</span>
                      {role === "loueur" && (
                        <span className="text-green-600 text-xl">✓</span>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900">
                      Mettre en location
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Je veux louer mes véhicules
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ben Hammi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Aimad"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Minimum 6 caractères"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Confirmez votre mot de passe"
                />
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Continuer →
              </button>
            </form>
          )}

          {/* ÉTAPE 2 : Pièces d'identité */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pays *
                </label>
                <select
                  value={pays}
                  onChange={(e) => {
                    setPays(e.target.value);
                    if (e.target.value !== "Maroc") {
                      setVille("");
                    }
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Maroc">Maroc 🇲🇦</option>
                  <option value="France">France 🇫🇷</option>
                  <option value="Espagne">Espagne 🇪🇸</option>
                  <option value="Belgique">Belgique 🇧🇪</option>
                  <option value="Allemagne">Allemagne 🇩🇪</option>
                  <option value="Pays-Bas">Pays-Bas 🇳🇱</option>
                  <option value="Italie">Italie 🇮🇹</option>
                  <option value="Suisse">Suisse 🇨🇭</option>
                  <option value="Canada">Canada 🇨🇦</option>
                  <option value="États-Unis">États-Unis 🇺🇸</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète *
                </label>
                <input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={
                    pays === "Maroc"
                      ? "123 Rue Mohammed V"
                      : "Votre adresse complète"
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville *
                </label>
                {pays === "Maroc" ? (
                  <select
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Sélectionnez votre ville</option>
                    <option value="Casablanca">Casablanca</option>
                    <option value="Rabat">Rabat</option>
                    <option value="Marrakech">Marrakech</option>
                    <option value="Fès">Fès</option>
                    <option value="Tanger">Tanger</option>
                    <option value="Agadir">Agadir</option>
                    <option value="Meknès">Meknès</option>
                    <option value="Oujda">Oujda</option>
                    <option value="Tétouan">Tétouan</option>
                    <option value="Safi">Safi</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Votre ville"
                  />
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Pièce d'identité (CIN/Passeport)
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro CIN/Passeport *
                  </label>
                  <input
                    type="text"
                    value={numeroCIN}
                    onChange={(e) => setNumeroCIN(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="AB123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos CIN (recto/verso) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotosCINChange}
                      className="hidden"
                      id="cin-upload"
                    />
                    <label htmlFor="cin-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Cliquez pour uploader (max 2)
                      </p>
                    </label>
                  </div>
                  {photosCIN.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {photosCIN.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt="CIN"
                            className="w-20 h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhotoCIN(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Permis de conduire
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro permis *
                    </label>
                    <input
                      type="text"
                      value={numeroPermis}
                      onChange={(e) => setNumeroPermis(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de validité *
                    </label>
                    <input
                      type="date"
                      value={dateValiditePermis}
                      onChange={(e) => setDateValiditePermis(e.target.value)}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos permis (recto/verso) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotosPermisChange}
                      className="hidden"
                      id="permis-upload"
                    />
                    <label htmlFor="permis-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Cliquez pour uploader (max 2)
                      </p>
                    </label>
                  </div>
                  {photosPermis.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {photosPermis.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Permis"
                            className="w-20 h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhotoPermis(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  ← Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Création..." : "Créer mon compte"}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-600 mt-6">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
