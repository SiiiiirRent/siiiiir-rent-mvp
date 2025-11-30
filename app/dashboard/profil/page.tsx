/**
 * app/dashboard/profil/page.tsx
 * Page de gestion du profil utilisateur
 * - Informations personnelles
 * - Informations entreprise (optionnel)
 * - Photo de profil
 * - Documents KYC (CNI, Permis)
 * - Documents société (Patente, RC)
 * - ✅ WHATSAPP - Partage lien agence
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/lib/types";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  submitKYCForVerification,
} from "@/lib/users";
import DocumentUpload from "@/components/profile/DocumentUpload";
import CompanyDocumentUpload from "@/components/profile/CompanyDocumentUpload";
import Image from "next/image";

// ✅ WHATSAPP - IMPORTS
import ShareWhatsAppButton from "@/components/whatsapp/ShareWhatsAppButton";
import {
  generateAgencyMessage,
  generateWhatsAppLink,
  getAgencyUrl,
} from "@/lib/whatsapp";

export default function ProfilPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editCompanyMode, setEditCompanyMode] = useState(false);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    adresse: "",
    ville: "",
    codePostal: "",
  });

  const [companyData, setCompanyData] = useState({
    nomSociete: "",
    ice: "",
    patente: "",
    registreCommerce: "",
    formeJuridique: "",
    adresseSociete: "",
    villeSociete: "",
    telephoneSociete: "",
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const profileData = await getUserProfile(user.uid);

      if (profileData) {
        setProfile(profileData);
        setFormData({
          nom: profileData.nom || "",
          prenom: profileData.prenom || "",
          telephone: profileData.telephone || "",
          adresse: profileData.adresse || "",
          ville: profileData.ville || "",
          codePostal: profileData.codePostal || "",
        });
        setCompanyData({
          nomSociete: profileData.companyInfo?.nomSociete || "",
          ice: profileData.companyInfo?.ice || "",
          patente: profileData.companyInfo?.patente || "",
          registreCommerce: profileData.companyInfo?.registreCommerce || "",
          formeJuridique: profileData.companyInfo?.formeJuridique || "",
          adresseSociete: profileData.companyInfo?.adresseSociete || "",
          villeSociete: profileData.companyInfo?.villeSociete || "",
          telephoneSociete: profileData.companyInfo?.telephoneSociete || "",
        });
      }
    } catch (error) {
      console.error("Erreur chargement profil:", error);
      alert("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompanyInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCompanyData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await updateUserProfile(user.uid, formData as Partial<UserProfile>);
      alert("✅ Profil mis à jour avec succès !");
      setEditMode(false);
      loadProfile();
    } catch (error: any) {
      console.error("Erreur sauvegarde:", error);
      alert(`❌ Erreur : ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await updateUserProfile(user.uid, {
        companyInfo: companyData,
      } as Partial<UserProfile>);
      alert("✅ Informations entreprise mises à jour !");
      setEditCompanyMode(false);
      loadProfile();
    } catch (error: any) {
      console.error("Erreur sauvegarde:", error);
      alert(`❌ Erreur : ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];

    try {
      setUploadingPhoto(true);
      await uploadProfilePhoto(user.uid, file);
      alert("✅ Photo de profil mise à jour !");
      loadProfile();
    } catch (error: any) {
      console.error("Erreur upload photo:", error);
      alert(`❌ Erreur : ${error.message}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user) return;

    if (!confirm("Supprimer votre photo de profil ?")) return;

    try {
      setUploadingPhoto(true);
      await deleteProfilePhoto(user.uid);
      alert("✅ Photo supprimée !");
      loadProfile();
    } catch (error: any) {
      console.error("Erreur suppression photo:", error);
      alert(`❌ Erreur : ${error.message}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmitKYC = async () => {
    if (!user) return;

    try {
      setSaving(true);
      await submitKYCForVerification(user.uid);
      alert(
        "✅ Documents soumis pour vérification !\n\nVous recevrez une confirmation par email sous 24-48h."
      );
      loadProfile();
    } catch (error: any) {
      console.error("Erreur soumission KYC:", error);
      alert(`❌ Erreur : ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const allDocumentsUploaded = (): boolean => {
    return !!(
      profile?.documents?.cni?.recto &&
      profile?.documents?.cni?.verso &&
      profile?.documents?.permis?.recto &&
      profile?.documents?.permis?.verso
    );
  };

  // ✅ WHATSAPP - Génération du lien agence
  const agencyUrl = user ? getAgencyUrl(user.uid) : "";
  const agencyName =
    profile?.displayName ||
    (profile?.prenom && profile?.nom
      ? `${profile.prenom} ${profile.nom}`
      : companyData.nomSociete || "Notre agence");

  const whatsappMessage = generateAgencyMessage({
    agencyName,
    agencyUrl,
    description: "Découvrez tous nos véhicules disponibles à la location",
  });

  const whatsappUrl = generateWhatsAppLink(whatsappMessage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-900">Profil introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Mon profil
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Gérez vos informations personnelles et documents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Photo de profil
            </h2>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-4">
                {profile.photoURL ? (
                  <Image
                    src={profile.photoURL}
                    alt="Photo de profil"
                    fill
                    sizes="128px"
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-4xl text-gray-400">👤</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 w-full">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                  <div className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium text-sm text-center disabled:opacity-50">
                    {uploadingPhoto ? "⏳ Upload..." : "📷 Changer la photo"}
                  </div>
                </label>
                {profile.photoURL && (
                  <button
                    onClick={handleDeletePhoto}
                    disabled={uploadingPhoto}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition font-medium text-sm disabled:opacity-50"
                  >
                    🗑️ Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Informations compte
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Rôle</p>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                  {profile.role === "loueur" ? "🚗 Loueur" : "👤 Locataire"}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Statut KYC</p>
                {profile.kycStatus === "verified" ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    ✅ Vérifié
                  </span>
                ) : profile.kycStatus === "submitted" ? (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                    ⏳ En cours de vérification
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                    📝 Non vérifié
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ✅ WHATSAPP - Section partage lien agence */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              🔗 Partager mon agence
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Partagez votre lien professionnel avec vos clients
            </p>
            <ShareWhatsAppButton
              whatsappUrl={whatsappUrl}
              variant="large"
              label="Partager mon agence"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-3 text-center">
              Votre lien : <br />
              <span className="text-green-600 break-all">{agencyUrl}</span>
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Informations personnelles
              </h2>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  ✏️ Modifier
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="+212 6 00 00 00 00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  name="ville"
                  value={formData.ville}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="Ex: Casablanca"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="Ex: 123 Rue Mohammed V"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal
                </label>
                <input
                  type="text"
                  name="codePostal"
                  value={formData.codePostal}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="Ex: 20000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {editMode && (
              <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      nom: profile.nom || "",
                      prenom: profile.prenom || "",
                      telephone: profile.telephone || "",
                      adresse: profile.adresse || "",
                      ville: profile.ville || "",
                      codePostal: profile.codePostal || "",
                    });
                  }}
                  disabled={saving}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                >
                  {saving ? "⏳ Enregistrement..." : "✅ Sauvegarder"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  🏢 Informations entreprise
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Optionnel - Pour les loueurs professionnels
                </p>
              </div>
              {!editCompanyMode && (
                <button
                  onClick={() => setEditCompanyMode(true)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  ✏️ Modifier
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la société
                </label>
                <input
                  type="text"
                  name="nomSociete"
                  value={companyData.nomSociete}
                  onChange={handleCompanyInputChange}
                  disabled={!editCompanyMode}
                  placeholder="Ex: SIIIIIR RENT SARL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ICE
                </label>
                <input
                  type="text"
                  name="ice"
                  value={companyData.ice}
                  onChange={handleCompanyInputChange}
                  disabled={!editCompanyMode}
                  placeholder="Ex: 002345678000012"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forme juridique
                </label>
                <select
                  name="formeJuridique"
                  value={companyData.formeJuridique}
                  onChange={handleCompanyInputChange}
                  disabled={!editCompanyMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Sélectionnez</option>
                  <option value="SARL">SARL</option>
                  <option value="SA">SA</option>
                  <option value="SNC">SNC</option>
                  <option value="SCS">SCS</option>
                  <option value="SCA">SCA</option>
                  <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de Patente
                </label>
                <input
                  type="text"
                  name="patente"
                  value={companyData.patente}
                  onChange={handleCompanyInputChange}
                  disabled={!editCompanyMode}
                  placeholder="Ex: 12345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registre de Commerce
                </label>
                <input
                  type="text"
                  name="registreCommerce"
                  value={companyData.registreCommerce}
                  onChange={handleCompanyInputChange}
                  disabled={!editCompanyMode}
                  placeholder="Ex: RC 123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse société
                </label>
                <input
                  type="text"
                  name="adresseSociete"
                  value={companyData.adresseSociete}
                  onChange={handleCompanyInputChange}
                  disabled={!editCompanyMode}
                  placeholder="Ex: 45 Boulevard Zerktouni"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  name="villeSociete"
                  value={companyData.villeSociete}
                  onChange={handleCompanyInputChange}
                  disabled={!editCompanyMode}
                  placeholder="Ex: Casablanca"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone société
                </label>
                <input
                  type="tel"
                  name="telephoneSociete"
                  value={companyData.telephoneSociete}
                  onChange={handleCompanyInputChange}
                  disabled={!editCompanyMode}
                  placeholder="+212 5 22 00 00 00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {editCompanyMode && (
              <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setEditCompanyMode(false);
                    setCompanyData({
                      nomSociete: profile.companyInfo?.nomSociete || "",
                      ice: profile.companyInfo?.ice || "",
                      patente: profile.companyInfo?.patente || "",
                      registreCommerce:
                        profile.companyInfo?.registreCommerce || "",
                      formeJuridique: profile.companyInfo?.formeJuridique || "",
                      adresseSociete: profile.companyInfo?.adresseSociete || "",
                      villeSociete: profile.companyInfo?.villeSociete || "",
                      telephoneSociete:
                        profile.companyInfo?.telephoneSociete || "",
                    });
                  }}
                  disabled={saving}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveCompany}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                >
                  {saving ? "⏳ Enregistrement..." : "✅ Sauvegarder"}
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-md font-semibold text-gray-900 mb-4">
                📄 Documents société
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uid && (
                  <>
                    <CompanyDocumentUpload
                      uid={uid}
                      documentType="patente"
                      currentURL={
                        profile.companyInfo?.documents?.patentePDF?.url
                      }
                      onUploadSuccess={loadProfile}
                    />
                    <CompanyDocumentUpload
                      uid={uid}
                      documentType="registreCommerce"
                      currentURL={
                        profile.companyInfo?.documents?.registreCommercePDF?.url
                      }
                      onUploadSuccess={loadProfile}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Documents d'identité
              </h2>
              <p className="text-sm text-gray-600">
                Pour louer vos véhicules en toute sécurité, nous devons vérifier
                votre identité.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">
                📇 Carte Nationale d'Identité (CNI)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uid && (
                  <>
                    <DocumentUpload
                      uid={uid}
                      documentType="cni"
                      side="recto"
                      currentURL={profile.documents?.cni?.recto}
                      onUploadSuccess={loadProfile}
                    />
                    <DocumentUpload
                      uid={uid}
                      documentType="cni"
                      side="verso"
                      currentURL={profile.documents?.cni?.verso}
                      onUploadSuccess={loadProfile}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">
                🚗 Permis de Conduire
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uid && (
                  <>
                    <DocumentUpload
                      uid={uid}
                      documentType="permis"
                      side="recto"
                      currentURL={profile.documents?.permis?.recto}
                      onUploadSuccess={loadProfile}
                    />
                    <DocumentUpload
                      uid={uid}
                      documentType="permis"
                      side="verso"
                      currentURL={profile.documents?.permis?.verso}
                      onUploadSuccess={loadProfile}
                    />
                  </>
                )}
              </div>
            </div>

            {allDocumentsUploaded() &&
              profile.kycStatus !== "submitted" &&
              profile.kycStatus !== "verified" && (
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSubmitKYC}
                    disabled={saving}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                  >
                    {saving
                      ? "⏳ Soumission..."
                      : "✅ Soumettre mes documents pour vérification"}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Vérification sous 24-48h • Vous recevrez une confirmation
                    par email
                  </p>
                </div>
              )}

            {profile.kycStatus === "submitted" && (
              <div className="pt-6 border-t border-gray-200">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-800 font-medium">
                    ⏳ Vos documents sont en cours de vérification
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Vous recevrez une confirmation par email sous 24-48h
                  </p>
                </div>
              </div>
            )}

            {profile.kycStatus === "verified" && (
              <div className="pt-6 border-t border-gray-200">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-medium">
                    ✅ Votre compte est vérifié !
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Vous pouvez maintenant louer vos véhicules en toute sécurité
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
