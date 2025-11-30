"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ContractSettings, defaultContractSettings } from "@/lib/types";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  User,
  Save,
  Upload,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ContratSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ContractSettings>({
    ...defaultContractSettings,
  } as ContractSettings);

  // Upload logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  async function loadSettings() {
    if (!user) return;

    try {
      const docRef = doc(db, "users", user.uid, "settings", "contract");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as ContractSettings;
        setSettings(data);
        if (data.companyLogoUrl) {
          setLogoPreview(data.companyLogoUrl);
        }
      }
    } catch (error) {
      console.error("Erreur chargement settings:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | undefined> => {
    if (!logoFile || !user) return settings.companyLogoUrl;

    try {
      setUploadingLogo(true);
      const storageRef = ref(
        storage,
        `contract-logos/${user.uid}/${Date.now()}_${logoFile.name}`
      );
      await uploadBytes(storageRef, logoFile);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Erreur upload logo:", error);
      alert("Erreur lors de l'upload du logo");
      return settings.companyLogoUrl;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Vous devez être connecté");
      return;
    }

    try {
      setSaving(true);

      // Upload logo si nécessaire
      let logoUrl = settings.companyLogoUrl;
      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      // Préparer les données
      const dataToSave: ContractSettings = {
        ...settings,
        ...(logoUrl && { companyLogoUrl: logoUrl }), // ✅ N'ajoute que si logoUrl existe
        updatedAt: Timestamp.now(),
      };

      // Sauvegarder dans Firestore
      const docRef = doc(db, "users", user.uid, "settings", "contract");
      await setDoc(docRef, dataToSave, { merge: true });

      alert("✅ Paramètres sauvegardés avec succès !");

      // Recharger les settings
      await loadSettings();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("❌ Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">
            Paramètres du contrat
          </h1>
          <p className="text-gray-600 mt-2">
            Configurez les informations qui apparaîtront sur vos contrats de
            location
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo de l'entreprise */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Logo de l'entreprise
            </h2>

            <div className="flex items-center gap-6">
              {logoPreview && (
                <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={logoPreview}
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              <div className="flex-1">
                <label className="block">
                  <span className="sr-only">Choisir un logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Format recommandé : PNG ou JPG, max 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Informations de l'entreprise */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              Informations de l'entreprise
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la société *
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) =>
                    setSettings({ ...settings, companyName: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: RENTAL CAR"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville *
                </label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) =>
                    setSettings({ ...settings, city: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Casablanca"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) =>
                    setSettings({ ...settings, phone: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète *
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) =>
                    setSettings({ ...settings, address: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 40 Boulevard Mohammed V"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site web
                </label>
                <input
                  type="text"
                  value={settings.website || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, website: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="www.example.com"
                />
              </div>
            </div>
          </div>

          {/* Informations légales */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Informations légales
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    ICE
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.showICE}
                      onChange={(e) =>
                        setSettings({ ...settings, showICE: e.target.checked })
                      }
                      className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span className="text-xs text-gray-600">Afficher</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={settings.ice || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, ice: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="12345678"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    RC (Registre Commerce)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.showRC}
                      onChange={(e) =>
                        setSettings({ ...settings, showRC: e.target.checked })
                      }
                      className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span className="text-xs text-gray-600">Afficher</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={settings.rc || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, rc: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="RC 123456"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    IF (Identifiant Fiscal)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.showIF}
                      onChange={(e) =>
                        setSettings({ ...settings, showIF: e.target.checked })
                      }
                      className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span className="text-xs text-gray-600">Afficher</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={settings.if || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, if: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="IF 123456"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Patente
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.showPatente}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          showPatente: e.target.checked,
                        })
                      }
                      className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span className="text-xs text-gray-600">Afficher</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={settings.patente || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, patente: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="123456"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    CNSS
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.showCNSS}
                      onChange={(e) =>
                        setSettings({ ...settings, showCNSS: e.target.checked })
                      }
                      className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span className="text-xs text-gray-600">Afficher</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={settings.cnss || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, cnss: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="123456"
                />
              </div>
            </div>
          </div>

          {/* Représentant légal */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Représentant légal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={settings.representantName || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      representantName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Mohamed Alami"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CIN
                </label>
                <input
                  type="text"
                  value={settings.representantCIN || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      representantCIN: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="AB123456"
                />
              </div>
            </div>
          </div>

          {/* Conditions particulières */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Conditions particulières
            </h2>

            <textarea
              value={settings.conditionsParticulieres || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  conditionsParticulieres: e.target.value,
                })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ajoutez des conditions particulières si nécessaire..."
            />
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end gap-4">
            <Link
              href="/espace-loueur"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving || uploadingLogo}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
