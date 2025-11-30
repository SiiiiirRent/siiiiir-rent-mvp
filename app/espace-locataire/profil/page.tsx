"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { db, storage, auth } from "@/lib/firebase";
import { UserProfile } from "@/lib/types";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Save,
  ArrowLeft,
  Lock,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  CreditCard,
} from "lucide-react";
import RequireLocataire from "@/components/auth/RequireLocataire";

function ProfilLocataireContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Formulaire
  const [displayName, setDisplayName] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [numeroCIN, setNumeroCIN] = useState("");
  const [numeroPermis, setNumeroPermis] = useState("");
  const [dateValiditePermis, setDateValiditePermis] = useState("");

  // Upload photo profil
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoURL, setPhotoURL] = useState("");

  // ✅ NOUVEAU : Upload documents
  const [uploadingCIN, setUploadingCIN] = useState(false);
  const [uploadingPermis, setUploadingPermis] = useState(false);
  const [cinPhotoURL, setCinPhotoURL] = useState("");
  const [permisPhotoURL, setPermisPhotoURL] = useState("");

  // Changer mot de passe
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalReservations: 0,
    reservationsEnCours: 0,
    reservationsTerminees: 0,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const data = { uid: user.uid, ...userDoc.data() } as UserProfile;
        setProfile(data);

        // Remplir le formulaire
        setDisplayName(data.displayName || "");
        setPrenom(data.prenom || "");
        setNom(data.nom || "");
        setTelephone(data.telephone || "");
        setAdresse(data.adresse || "");
        setVille(data.ville || "");
        setCodePostal(data.codePostal || "");
        setPhotoURL(data.photoURL || "");
        setNumeroCIN(data.numeroCIN || "");
        setNumeroPermis(data.numeroPermis || "");

        // ✅ NOUVEAU : Charger les URLs des documents
        setCinPhotoURL((data as any).cinPhotoURL || "");
        setPermisPhotoURL((data as any).permisPhotoURL || "");

        // Date de naissance
        if (data.dateNaissance) {
          const d = data.dateNaissance.toDate
            ? data.dateNaissance.toDate()
            : new Date(data.dateNaissance);
          setDateNaissance(d.toISOString().split("T")[0]);
        }

        // Date validité permis
        if (data.dateValiditePermis) {
          const d = data.dateValiditePermis.toDate
            ? data.dateValiditePermis.toDate()
            : new Date(data.dateValiditePermis);
          setDateValiditePermis(d.toISOString().split("T")[0]);
        }
      }
    } catch (error) {
      console.error("Erreur chargement profil:", error);
      setErrorMessage("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const { collection, query, where, getDocs } = await import(
        "firebase/firestore"
      );
      const reservationsQuery = query(
        collection(db, "reservations"),
        where("locataireId", "==", user.uid)
      );
      const snapshot = await getDocs(reservationsQuery);

      const total = snapshot.size;
      const enCours = snapshot.docs.filter((doc) =>
        ["confirmee", "en_cours"].includes(doc.data().status)
      ).length;
      const terminees = snapshot.docs.filter(
        (doc) => doc.data().status === "terminee"
      ).length;

      setStats({
        totalReservations: total,
        reservationsEnCours: enCours,
        reservationsTerminees: terminees,
      });
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingPhoto(true);
      setErrorMessage("");

      const storageRef = ref(
        storage,
        `profile-photos/${user.uid}/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setPhotoURL(url);
      setSuccessMessage("Photo téléchargée ! N'oubliez pas de sauvegarder.");
    } catch (error) {
      console.error("Erreur upload photo:", error);
      setErrorMessage("Erreur lors du téléchargement de la photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ✅ NOUVEAU : Upload photo CIN/Passeport
  const handleCINUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingCIN(true);
      setErrorMessage("");

      const storageRef = ref(
        storage,
        `documents/${user.uid}/cin_${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setCinPhotoURL(url);
      setSuccessMessage(
        "Document CIN/Passeport téléchargé ! N'oubliez pas de sauvegarder."
      );
    } catch (error) {
      console.error("Erreur upload CIN:", error);
      setErrorMessage("Erreur lors du téléchargement du document");
    } finally {
      setUploadingCIN(false);
    }
  };

  // ✅ NOUVEAU : Upload photo Permis
  const handlePermisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingPermis(true);
      setErrorMessage("");

      const storageRef = ref(
        storage,
        `documents/${user.uid}/permis_${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setPermisPhotoURL(url);
      setSuccessMessage(
        "Document Permis téléchargé ! N'oubliez pas de sauvegarder."
      );
    } catch (error) {
      console.error("Erreur upload Permis:", error);
      setErrorMessage("Erreur lors du téléchargement du document");
    } finally {
      setUploadingPermis(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const updateData: any = {
        displayName,
        prenom,
        nom,
        telephone,
        adresse,
        ville,
        codePostal,
        numeroCIN,
        numeroPermis,
        photoURL,
        cinPhotoURL, // ✅ NOUVEAU
        permisPhotoURL, // ✅ NOUVEAU
        updatedAt: serverTimestamp(),
      };

      if (dateNaissance) {
        updateData.dateNaissance = new Date(dateNaissance);
      }

      if (dateValiditePermis) {
        updateData.dateValiditePermis = new Date(dateValiditePermis);
      }

      await updateDoc(doc(db, "users", user.uid), updateData);

      // Mise à jour Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName,
          photoURL,
        });
      }

      setSuccessMessage("✅ Profil mis à jour avec succès !");
      await loadProfile();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      setErrorMessage("Erreur lors de la sauvegarde du profil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;

    if (newPassword !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      setChangingPassword(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Réauthentification requise
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Changement du mot de passe
      await updatePassword(auth.currentUser, newPassword);

      setSuccessMessage("✅ Mot de passe changé avec succès !");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Erreur changement mot de passe:", error);
      if (error.code === "auth/wrong-password") {
        setErrorMessage("Mot de passe actuel incorrect");
      } else {
        setErrorMessage("Erreur lors du changement de mot de passe");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/espace-locataire" className="text-2xl font-bold">
              SIIIIIR <span className="text-green-600">RENT</span>
            </Link>
            <Link
              href="/espace-locataire"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Mes réservations</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon profil</h1>
          <p className="text-gray-600">Gérez vos informations personnelles</p>
        </div>

        {/* MESSAGES */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* STATISTIQUES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-600 mb-1">Total réservations</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalReservations}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-600 mb-1">En cours</p>
            <p className="text-3xl font-bold text-green-600">
              {stats.reservationsEnCours}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-600 mb-1">Terminées</p>
            <p className="text-3xl font-bold text-gray-600">
              {stats.reservationsTerminees}
            </p>
          </div>
        </div>

        {/* PHOTO DE PROFIL */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Photo de profil
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt="Photo de profil"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-bold">
                  {displayName?.[0] || user?.email?.[0] || "L"}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {displayName || user?.email}
              </p>
              <p className="text-sm text-gray-600">Locataire</p>
              {uploadingPhoto && (
                <p className="text-sm text-green-600 flex items-center gap-2 mt-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Téléchargement...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* FORMULAIRE PROFIL */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* INFORMATIONS PERSONNELLES */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations personnelles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Nom complet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Prénom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Nom de famille"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* CONTACT */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  L&apos;email ne peut pas être modifié
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
            </div>
          </div>

          {/* ADRESSE */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Adresse
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète
                </label>
                <input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Numéro et nom de rue"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ville"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={codePostal}
                    onChange={(e) => setCodePostal(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Code postal"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DOCUMENTS */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents d&apos;identité
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro CIN
                </label>
                <input
                  type="text"
                  value={numeroCIN}
                  onChange={(e) => setNumeroCIN(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="XX123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro permis de conduire
                </label>
                <input
                  type="text"
                  value={numeroPermis}
                  onChange={(e) => setNumeroPermis(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Numéro de permis"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de validité du permis
                </label>
                <input
                  type="date"
                  value={dateValiditePermis}
                  onChange={(e) => setDateValiditePermis(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* ✅ NOUVELLE SECTION : Upload des photos de documents */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Photos des documents
            </h2>

            <div className="space-y-6">
              {/* Photo CIN/Passeport */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Photo CIN / Passeport (recto/verso)
                </label>

                {cinPhotoURL ? (
                  <div className="relative inline-block">
                    <img
                      src={cinPhotoURL}
                      alt="CIN/Passeport"
                      className="w-full max-w-sm h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setCinPhotoURL("")}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingCIN ? (
                        <Loader className="w-10 h-10 text-green-600 animate-spin mb-3" />
                      ) : (
                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                      )}
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">
                          Cliquez pour télécharger
                        </span>{" "}
                        ou glissez-déposez
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, JPEG (MAX. 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCINUpload}
                      className="hidden"
                      disabled={uploadingCIN}
                    />
                  </label>
                )}
              </div>

              {/* Photo Permis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Photo Permis de conduire (recto/verso)
                </label>

                {permisPhotoURL ? (
                  <div className="relative inline-block">
                    <img
                      src={permisPhotoURL}
                      alt="Permis de conduire"
                      className="w-full max-w-sm h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setPermisPhotoURL("")}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingPermis ? (
                        <Loader className="w-10 h-10 text-green-600 animate-spin mb-3" />
                      ) : (
                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                      )}
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">
                          Cliquez pour télécharger
                        </span>{" "}
                        ou glissez-déposez
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, JPEG (MAX. 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePermisUpload}
                      className="hidden"
                      disabled={uploadingPermis}
                    />
                  </label>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Astuce :</strong> Pour les documents recto/verso,
                  vous pouvez prendre une seule photo avec les deux côtés
                  visibles, ou uploader une photo puis la remplacer par
                  l&apos;autre côté si nécessaire.
                </p>
              </div>
            </div>
          </div>

          {/* BOUTON SAUVEGARDER */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Sauvegarder les modifications
              </>
            )}
          </button>
        </form>

        {/* CHANGER MOT DE PASSE */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Mot de passe
            </h2>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Modifier
              </button>
            )}
          </div>

          {showPasswordForm ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword
                    ? "Changement..."
                    : "Changer le mot de passe"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setErrorMessage("");
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <p className="text-gray-600">••••••••</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilLocatairePage() {
  return (
    <RequireLocataire>
      <ProfilLocataireContent />
    </RequireLocataire>
  );
}
