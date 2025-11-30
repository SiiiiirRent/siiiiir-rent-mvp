/**
 * Page "Mes véhicules" - Liste et gestion des véhicules du loueur
 * Version 2.0 avec :
 * - Upload photos optimisé avec gestion d'erreurs
 * - Champ immatriculation (lettres arabes supportées)
 * - Statut de disponibilité détaillé
 * - Interface 100% responsive
 * - Gestion rétrocompatibilité ancien format
 * - Bouton accès calendrier disponibilités
 * - ✅ WHATSAPP - Partage véhicules
 * - ✅ TYPESCRIPT - Corrections types onChange
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { Vehicle, VehicleFormData, VehicleStatus } from "@/lib/types";
import Image from "next/image";
import { Calendar } from "lucide-react";

// ✅ WHATSAPP - IMPORTS
import ShareWhatsAppButton from "@/components/whatsapp/ShareWhatsAppButton";
import {
  generateVehicleMessage,
  generateWhatsAppLink,
  getVehicleUrl,
} from "@/lib/whatsapp";

export default function MesVehiculesPage() {
  const { user } = useAuth();
  const router = useRouter();

  // États pour les véhicules
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour le formulaire
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>({
    marque: "",
    modele: "",
    annee: new Date().getFullYear(),
    immatriculation: "",
    type: "berline",
    transmission: "manuelle",
    carburant: "essence",
    places: 5,
    prix: 0,
    statut: "disponible",
    ville: "",
    adresse: "",
    description: "",
    equipements: [],
  });

  // États pour les photos
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoURLs, setPhotoURLs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Charger les véhicules au montage du composant
  useEffect(() => {
    if (user) {
      loadVehicles();
    }
  }, [user]);

  /**
   * Charge tous les véhicules du loueur depuis Firestore
   */
  const loadVehicles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, "vehicles"),
        where("userId", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
      const vehiclesData: Vehicle[] = [];

      querySnapshot.forEach((docSnap) => {
        vehiclesData.push({ id: docSnap.id, ...docSnap.data() } as Vehicle);
      });

      // Trier par date de création (plus récent d'abord)
      vehiclesData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Erreur lors du chargement des véhicules:", error);
      alert(
        "Erreur lors du chargement des véhicules. Vérifiez votre connexion."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Upload des photos vers Firebase Storage avec gestion d'erreurs
   */
  const uploadPhotos = async (): Promise<string[]> => {
    if (photoFiles.length === 0) return photoURLs;

    const uploadedURLs: string[] = [...photoURLs];

    try {
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];

        // Vérifier la taille du fichier (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`La photo "${file.name}" est trop grande (max 5MB)`);
        }

        // Créer un nom de fichier unique
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}_${randomStr}_${file.name}`;

        // Référence Storage
        const storageRef = ref(storage, `vehicles/${user!.uid}/${fileName}`);

        console.log(`📤 Upload photo ${i + 1}/${photoFiles.length}...`);

        // Upload
        await uploadBytes(storageRef, file);

        // Récupérer l'URL
        const url = await getDownloadURL(storageRef);
        uploadedURLs.push(url);

        // Mettre à jour le progrès
        setUploadProgress(Math.round(((i + 1) / photoFiles.length) * 100));

        console.log(`✅ Photo ${i + 1} uploadée`);
      }

      return uploadedURLs;
    } catch (error) {
      console.error("❌ Erreur upload photos:", error);
      throw error;
    }
  };

  /**
   * Ajouter un nouveau véhicule
   */
  const handleAddVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      alert("Vous devez être connecté pour ajouter un véhicule");
      return;
    }

    // Validation : au moins une photo
    if (photoFiles.length === 0 && photoURLs.length === 0) {
      alert("Veuillez ajouter au moins une photo de votre véhicule");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      console.log("🚀 Début ajout véhicule...");

      // Upload des photos
      console.log("📤 Upload des photos...");
      const uploadedPhotos = await uploadPhotos();
      console.log("✅ Photos uploadées:", uploadedPhotos);

      // Créer le document dans Firestore
      console.log("💾 Création document Firestore...");
      const docRef = await addDoc(collection(db, "vehicles"), {
        ...formData,
        userId: user.uid,
        photos: uploadedPhotos,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Véhicule créé avec ID:", docRef.id);

      alert("✅ Véhicule ajouté avec succès !");
      resetForm();
      loadVehicles();
    } catch (error: any) {
      console.error("❌ Erreur complète:", error);
      alert(
        `❌ Erreur : ${error.message || "Impossible d'ajouter le véhicule"}`
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Modifier un véhicule existant
   */
  const handleUpdateVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingVehicle || !user) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Upload des nouvelles photos
      const uploadedPhotos = await uploadPhotos();

      // Mettre à jour le document dans Firestore
      const vehicleRef = doc(db, "vehicles", editingVehicle.id);
      await updateDoc(vehicleRef, {
        ...formData,
        photos: uploadedPhotos,
        updatedAt: serverTimestamp(),
      });

      alert("✅ Véhicule modifié avec succès !");
      resetForm();
      loadVehicles();
    } catch (error: any) {
      console.error("❌ Erreur modification:", error);
      alert(
        `❌ Erreur : ${error.message || "Impossible de modifier le véhicule"}`
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Supprimer un véhicule
   */
  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (
      !confirm(`⚠️ Êtes-vous sûr de vouloir supprimer ${vehicle.marque} ${vehicle.modele} ?

Cette action est irréversible et supprimera :
- Le véhicule
- Toutes ses photos
- Toutes ses réservations (futures et passées)

Confirmer ?`)
    ) {
      return;
    }

    try {
      // Supprimer les photos du Storage
      for (const photoURL of vehicle.photos) {
        try {
          const photoRef = ref(storage, photoURL);
          await deleteObject(photoRef);
        } catch (err) {
          console.error("Erreur suppression photo:", err);
        }
      }

      // Supprimer le document Firestore
      await deleteDoc(doc(db, "vehicles", vehicle.id));

      alert("✅ Véhicule supprimé avec succès !");
      loadVehicles();
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      alert("❌ Erreur lors de la suppression du véhicule");
    }
  };

  /**
   * Préparer le formulaire pour modifier un véhicule
   */
  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      marque: vehicle.marque,
      modele: vehicle.modele,
      annee: vehicle.annee,
      immatriculation: vehicle.immatriculation || "",
      type: vehicle.type,
      transmission: vehicle.transmission,
      carburant: vehicle.carburant,
      places: vehicle.places,
      prix: vehicle.prix,
      statut: vehicle.statut || "disponible",
      ville: vehicle.ville,
      adresse: vehicle.adresse || "",
      description: vehicle.description,
      equipements: vehicle.equipements,
    });
    setPhotoURLs(vehicle.photos);
    setPhotoFiles([]);
    setShowForm(true);
  };

  /**
   * Réinitialiser le formulaire
   */
  const resetForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
    setFormData({
      marque: "",
      modele: "",
      annee: new Date().getFullYear(),
      immatriculation: "",
      type: "berline",
      transmission: "manuelle",
      carburant: "essence",
      places: 5,
      prix: 0,
      statut: "disponible",
      ville: "",
      adresse: "",
      description: "",
      equipements: [],
    });
    setPhotoFiles([]);
    setPhotoURLs([]);
    setUploadProgress(0);
  };

  // ✅ CORRECTION TYPESCRIPT - 3 fonctions séparées pour les onChange

  /**
   * Gérer les changements dans les inputs
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let processedValue: string | number = value;

    if (name === "annee" || name === "places" || name === "prix") {
      processedValue = Number(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  /**
   * Gérer les changements dans les textarea
   */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Gérer les changements dans les select
   */
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Gérer la sélection de photos
   */
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const totalPhotos = photoFiles.length + photoURLs.length + files.length;

      if (totalPhotos > 5) {
        alert("❌ Vous ne pouvez ajouter que 5 photos maximum");
        return;
      }

      // Vérifier la taille de chaque fichier
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`❌ La photo "${file.name}" est trop grande (max 5MB)`);
          return;
        }
      }

      setPhotoFiles((prev) => [...prev, ...files]);
    }
  };

  /**
   * Supprimer une photo (avant upload)
   */
  const removePhoto = (index: number, isFile: boolean) => {
    if (isFile) {
      setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    } else {
      setPhotoURLs((prev) => prev.filter((_, i) => i !== index));
    }
  };

  /**
   * Obtenir le badge de statut avec couleurs
   */
  const getStatusBadge = (vehicle: Vehicle) => {
    let statut: VehicleStatus;

    if (vehicle.statut) {
      statut = vehicle.statut;
    } else {
      // @ts-ignore - ancien format avec disponible: boolean
      statut = vehicle.disponible ? "disponible" : "non_disponible";
    }

    const badges = {
      disponible: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "✅ Disponible",
      },
      loue: { bg: "bg-blue-100", text: "text-blue-800", label: "🔵 Loué" },
      en_revision: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "🔧 En révision",
      },
      en_reparation: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        label: "🛠️ En réparation",
      },
      non_disponible: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "❌ Non disponible",
      },
    };

    const badge = badges[statut];
    return (
      <span
        className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-sm font-medium`}
      >
        {badge.label}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement de vos véhicules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Mes véhicules
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Gérez votre flotte de véhicules ({vehicles.length} véhicule
            {vehicles.length > 1 ? "s" : ""})
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-green-700 transition font-semibold text-sm md:text-base w-full sm:w-auto"
        >
          ➕ Ajouter un véhicule
        </button>
      </div>

      {/* Liste des véhicules */}
      {vehicles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
          <div className="text-4xl md:text-6xl mb-4">🚗</div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
            Aucun véhicule pour le moment
          </h2>
          <p className="text-gray-600 mb-6 text-sm md:text-base">
            Ajoutez votre premier véhicule pour commencer à recevoir des
            réservations.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            ➕ Ajouter mon premier véhicule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {vehicles.map((vehicle) => {
            // ✅ WHATSAPP - Génération du lien pour chaque véhicule
            const vehicleUrl = getVehicleUrl(vehicle.id);
            const whatsappMessage = generateVehicleMessage({
              vehicleName: `${vehicle.marque} ${vehicle.modele}`,
              prixParJour: vehicle.prix,
              vehicleUrl,
            });
            const whatsappUrl = generateWhatsAppLink(whatsappMessage);

            return (
              <div
                key={vehicle.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {/* Photo */}
                <div className="relative h-40 md:h-48 bg-gray-200">
                  {vehicle.photos && vehicle.photos.length > 0 ? (
                    <Image
                      src={vehicle.photos[0]}
                      alt={`${vehicle.marque} ${vehicle.modele}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-3xl md:text-4xl">
                      🚗
                    </div>
                  )}

                  {/* Badge statut */}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(vehicle)}
                  </div>
                </div>

                {/* Infos */}
                <div className="p-3 md:p-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 truncate">
                    {vehicle.marque} {vehicle.modele}
                  </h3>

                  {/* Immatriculation */}
                  {vehicle.immatriculation && (
                    <p className="text-xs md:text-sm text-gray-600 mb-2">
                      🚘 {vehicle.immatriculation}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 mb-3">
                    <span>📅 {vehicle.annee}</span>
                    <span>⚙️ {vehicle.transmission}</span>
                    <span>⛽ {vehicle.carburant}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xl md:text-2xl font-bold text-green-600">
                        {vehicle.prix}
                      </span>
                      <span className="text-gray-600 text-xs md:text-sm">
                        {" "}
                        MAD/j
                      </span>
                    </div>
                    <span className="text-gray-600 text-xs md:text-sm">
                      📍 {vehicle.ville}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {/* ✅ WHATSAPP - Bouton partage */}
                    <ShareWhatsAppButton
                      whatsappUrl={whatsappUrl}
                      variant="small"
                      label="Partager sur WhatsApp"
                      className="w-full"
                    />

                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/vehicules/${vehicle.id}/calendrier`
                        )
                      }
                      className="w-full bg-blue-50 text-blue-600 px-3 md:px-4 py-2 rounded-lg hover:bg-blue-100 transition font-medium text-xs md:text-sm flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Calendrier
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditVehicle(vehicle)}
                        className="flex-1 bg-gray-50 text-gray-600 px-3 md:px-4 py-2 rounded-lg hover:bg-gray-100 transition font-medium text-xs md:text-sm"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle)}
                        className="flex-1 bg-red-50 text-red-600 px-3 md:px-4 py-2 rounded-lg hover:bg-red-100 transition font-medium text-xs md:text-sm"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {editingVehicle
                  ? "Modifier le véhicule"
                  : "Ajouter un véhicule"}
              </h2>
              <button
                onClick={resetForm}
                disabled={uploading}
                className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={editingVehicle ? handleUpdateVehicle : handleAddVehicle}
              className="p-4 md:p-6 space-y-4 md:space-y-6"
            >
              {/* Marque et Modèle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marque *
                  </label>
                  <input
                    type="text"
                    name="marque"
                    value={formData.marque}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Volkswagen"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modèle *
                  </label>
                  <input
                    type="text"
                    name="modele"
                    value={formData.modele}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Golf GTI"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Immatriculation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immatriculation (optionnel)
                </label>
                <input
                  type="text"
                  name="immatriculation"
                  value={formData.immatriculation}
                  onChange={handleInputChange}
                  placeholder="Ex: أ-12345-12 ou 12345-أ-12"
                  dir="auto"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format marocain supporté (lettres arabes acceptées)
                </p>
              </div>

              {/* Année et Places */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année *
                  </label>
                  <input
                    type="number"
                    name="annee"
                    value={formData.annee}
                    onChange={handleInputChange}
                    required
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de places *
                  </label>
                  <input
                    type="number"
                    name="places"
                    value={formData.places}
                    onChange={handleInputChange}
                    required
                    min={1}
                    max={9}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Type, Transmission, Carburant */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleSelectChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="berline">Berline</option>
                    <option value="suv">SUV</option>
                    <option value="citadine">Citadine</option>
                    <option value="utilitaire">Utilitaire</option>
                    <option value="moto">Moto</option>
                    <option value="4x4">4x4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transmission *
                  </label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleSelectChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="manuelle">Manuelle</option>
                    <option value="automatique">Automatique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carburant *
                  </label>
                  <select
                    name="carburant"
                    value={formData.carburant}
                    onChange={handleSelectChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="essence">Essence</option>
                    <option value="diesel">Diesel</option>
                    <option value="electrique">Électrique</option>
                    <option value="hybride">Hybride</option>
                  </select>
                </div>
              </div>

              {/* Statut de disponibilité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut de disponibilité *
                </label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleSelectChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="disponible">
                    ✅ Disponible à la location
                  </option>
                  <option value="loue">🔵 Actuellement loué</option>
                  <option value="en_revision">
                    🔧 En révision / Entretien
                  </option>
                  <option value="en_reparation">🛠️ En réparation</option>
                  <option value="non_disponible">❌ Non disponible</option>
                </select>
              </div>

              {/* Prix et Ville */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix par jour (MAD) *
                  </label>
                  <input
                    type="number"
                    name="prix"
                    value={formData.prix}
                    onChange={handleInputChange}
                    required
                    min={0}
                    placeholder="Ex: 350"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville *
                  </label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Casablanca"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse (optionnel)
                </label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  placeholder="Ex: 123 Rue Mohammed V"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleTextareaChange}
                  required
                  rows={4}
                  placeholder="Décrivez votre véhicule (état, particularités, équipements, etc.)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos * (max 5, max 5MB chacune)
                </label>

                {/* Photos existantes */}
                {photoURLs.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                    {photoURLs.map((url, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={url}
                          alt={`Photo ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index, false)}
                          disabled={uploading}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 disabled:opacity-50"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nouvelles photos sélectionnées */}
                {photoFiles.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                    {photoFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="w-full h-20 bg-green-100 border-2 border-green-500 border-dashed rounded-lg flex flex-col items-center justify-center">
                          <span className="text-xs text-green-700 font-medium">
                            Nouvelle
                          </span>
                          <span className="text-xs text-green-600">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhoto(index, true)}
                          disabled={uploading}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 disabled:opacity-50"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input pour ajouter des photos */}
                {photoURLs.length + photoFiles.length < 5 && (
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    disabled={uploading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                )}

                <p className="text-xs text-gray-500 mt-2">
                  {photoURLs.length + photoFiles.length}/5 photos • Formats
                  acceptés : JPG, PNG, WebP • Max 5MB par photo
                </p>
              </div>

              {/* Barre de progression upload */}
              {uploading && uploadProgress > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700 mb-2">
                    📤 Upload en cours... {uploadProgress}%
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={uploading}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={
                    uploading ||
                    (photoFiles.length === 0 && photoURLs.length === 0)
                  }
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading
                    ? "⏳ Enregistrement..."
                    : editingVehicle
                      ? "✅ Modifier"
                      : "✅ Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
