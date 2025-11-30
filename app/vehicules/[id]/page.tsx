"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  MapPin,
  Users,
  Fuel,
  Settings,
  Calendar,
  ArrowLeft,
  Shield,
  X,
  Clock,
} from "lucide-react";
import {
  differenceInDays,
  format,
  addDays,
  setHours,
  setMinutes,
} from "date-fns";
import { fr } from "date-fns/locale";

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  // Dates de réservation
  const [dateDebut, setDateDebut] = useState<Date | null>(null);
  const [dateFin, setDateFin] = useState<Date | null>(null);
  const [excludedDates, setExcludedDates] = useState<Date[]>([]);

  // ✅ NOUVEAUX STATES pour horaires et adresses
  const [heureDebut, setHeureDebut] = useState("10:00");
  const [heureFin, setHeureFin] = useState("10:00");
  const [adresseDepart, setAdresseDepart] = useState("");
  const [adresseRetour, setAdresseRetour] = useState("");
  const [memeAdresse, setMemeAdresse] = useState(true);

  // Modal de réservation
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Infos locataire
  const [locataireNom, setLocataireNom] = useState("");
  const [locataireEmail, setLocataireEmail] = useState(user?.email || "");
  const [locatairePhone, setLocatairePhone] = useState("");

  // ✅ NOUVEAU : Vérification KYC
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(true);

  useEffect(() => {
    loadVehicle();
    loadExcludedDates();
  }, [vehicleId]);

  useEffect(() => {
    if (user?.email) {
      setLocataireEmail(user.email);
      if (user.displayName) {
        setLocataireNom(user.displayName);
      }
    }
  }, [user]);

  // ✅ Pré-remplir l'adresse de départ avec l'adresse du véhicule
  useEffect(() => {
    if (vehicle?.adresse && vehicle?.ville) {
      setAdresseDepart(`${vehicle.adresse}, ${vehicle.ville}`);
    } else if (vehicle?.ville) {
      setAdresseDepart(vehicle.ville);
    }
  }, [vehicle]);

  // ✅ Charger le statut KYC de l'utilisateur
  useEffect(() => {
    const loadKycStatus = async () => {
      if (!user) {
        setLoadingKyc(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setKycStatus(userData.kycStatus || "pending");
        }
      } catch (error) {
        console.error("Erreur chargement KYC:", error);
      } finally {
        setLoadingKyc(false);
      }
    };

    loadKycStatus();
  }, [user]);

  async function loadVehicle() {
    try {
      const vehicleDoc = await getDoc(doc(db, "vehicles", vehicleId));

      if (vehicleDoc.exists()) {
        setVehicle({
          id: vehicleDoc.id,
          ...vehicleDoc.data(),
        } as Vehicle);
      }
    } catch (error) {
      console.error("Erreur chargement véhicule:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadExcludedDates() {
    try {
      const reservationsQuery = query(
        collection(db, "reservations"),
        where("vehicleId", "==", vehicleId),
        where("status", "in", ["en_attente", "confirmee", "en_cours"])
      );

      const snapshot = await getDocs(reservationsQuery);
      const allExcludedDates: Date[] = [];

      snapshot.forEach((doc) => {
        const reservation = doc.data();
        const start = reservation.dateDebut.toDate();
        const end = reservation.dateFin.toDate();

        // Ajouter toutes les dates entre start et end
        let currentDate = new Date(start);
        while (currentDate <= end) {
          allExcludedDates.push(new Date(currentDate));
          currentDate = addDays(currentDate, 1);
        }
      });

      setExcludedDates(allExcludedDates);
      console.log("📅 Dates exclues:", allExcludedDates.length);
    } catch (error) {
      console.error("Erreur chargement dates:", error);
    }
  }

  const calculatePrice = () => {
    if (!dateDebut || !dateFin || !vehicle) return 0;

    const days = differenceInDays(dateFin, dateDebut) + 1;
    return days > 0 ? days * vehicle.prix : 0;
  };

  const handleOpenReservationModal = () => {
    if (!dateDebut || !dateFin) {
      alert("Veuillez sélectionner les dates de location");
      return;
    }

    if (!user) {
      router.push(`/login?redirect=/vehicules/${vehicleId}`);
      return;
    }

    // ✅ BLOQUER SI KYC NON VÉRIFIÉ
    if (kycStatus !== "verified") {
      alert(
        "⚠️ Votre compte n'est pas encore vérifié.\n\n" +
          "Pour effectuer une réservation, vous devez d'abord faire vérifier votre identité.\n\n" +
          "Cela prend généralement moins de 24h."
      );
      return;
    }

    setShowReservationModal(true);
  };

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicle || !user || !dateDebut || !dateFin) return;

    if (!locataireNom || !locataireEmail || !locatairePhone) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // ✅ Validation des champs horaires et adresses
    if (!adresseDepart.trim()) {
      alert("Veuillez renseigner l'adresse de départ");
      return;
    }

    if (!memeAdresse && !adresseRetour.trim()) {
      alert("Veuillez renseigner l'adresse de retour");
      return;
    }

    try {
      setSubmitting(true);

      const nbJours = differenceInDays(dateFin, dateDebut) + 1;
      const prixTotal = nbJours * vehicle.prix;

      // ✅ Combiner date + heure
      const [heureD, minuteD] = heureDebut.split(":").map(Number);
      const [heureF, minuteF] = heureFin.split(":").map(Number);

      const dateDebutAvecHeure = setMinutes(
        setHours(dateDebut, heureD),
        minuteD
      );
      const dateFinAvecHeure = setMinutes(setHours(dateFin, heureF), minuteF);

      // Vérifier la disponibilité
      console.log("🔍 Vérification de la disponibilité...");

      const reservationsQuery = query(
        collection(db, "reservations"),
        where("vehicleId", "==", vehicle.id),
        where("status", "in", ["en_attente", "confirmee", "en_cours"])
      );

      const existingReservations = await getDocs(reservationsQuery);

      let isAvailable = true;

      existingReservations.forEach((doc) => {
        const reservation = doc.data();
        const resStart = reservation.dateDebut.toDate();
        const resEnd = reservation.dateFin.toDate();

        if (
          (dateDebutAvecHeure >= resStart && dateDebutAvecHeure <= resEnd) ||
          (dateFinAvecHeure >= resStart && dateFinAvecHeure <= resEnd) ||
          (dateDebutAvecHeure <= resStart && dateFinAvecHeure >= resEnd)
        ) {
          isAvailable = false;
        }
      });

      if (!isAvailable) {
        alert(
          "❌ Désolé, ce véhicule n'est pas disponible pour ces dates. Veuillez choisir d'autres dates."
        );
        setSubmitting(false);
        return;
      }

      console.log("✅ Véhicule disponible !");

      // RÉCUPÉRER LES INFOS COMPLÈTES DU LOCATAIRE
      console.log("📝 Récupération des infos complètes du locataire...");
      const locataireDoc = await getDoc(doc(db, "users", user.uid));
      const locataireData = locataireDoc.exists() ? locataireDoc.data() : {};

      // Récupérer les infos du véhicule
      const vehicleDoc = await getDoc(doc(db, "vehicles", vehicle.id));
      const vehicleData = vehicleDoc.exists() ? vehicleDoc.data() : {};

      // ✅ Créer la réservation avec horaires et adresses
      const reservationData = {
        vehicleId: vehicle.id,
        loueurId: vehicle.userId,
        locataireId: user.uid,
        vehicleMarque: vehicle.marque,
        vehicleModele: vehicle.modele,
        vehiclePhoto: vehicle.photos?.[0] || "",
        vehiclePrixJour: vehicle.prix,
        vehicleImmatriculation: vehicleData?.immatriculation || "",
        locataireNom,
        locataireEmail,
        locatairePhone,

        // INFOS LOCATAIRE DEPUIS LE PROFIL UTILISATEUR
        prenom: locataireData.prenom || "",
        nom: locataireData.nom || "",
        adresse: locataireData.adresse || "",
        ville: locataireData.ville || "",
        pays: locataireData.pays || "",
        dateNaissance: locataireData.dateNaissance || null,
        numeroCIN: locataireData.numeroCIN || "",
        dateValiditePermis: locataireData.dateValiditePermis || null,
        numeroPermis: locataireData.numeroPermis || "",

        // ✅ HORAIRES ET ADRESSES
        lieuDepart: adresseDepart.trim(),
        lieuRetour: memeAdresse ? adresseDepart.trim() : adresseRetour.trim(),
        heureDebut: heureDebut,
        heureFin: heureFin,
        kmDepart: 0,
        kmRetour: 0,

        dateDebut: Timestamp.fromDate(dateDebutAvecHeure),
        dateFin: Timestamp.fromDate(dateFinAvecHeure),
        nbJours,
        prixTotal,
        status: "en_attente",
        paymentStatus: "non_paye",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, "reservations"),
        reservationData
      );
      console.log("✅ Réservation créée:", docRef.id);

      // Récupérer les infos du loueur (propriétaire)
      console.log("🔍 Récupération des infos du loueur:", vehicle.userId);
      const loueurDoc = await getDoc(doc(db, "users", vehicle.userId));
      const loueurEmail = loueurDoc.exists() ? loueurDoc.data().email : null;
      const loueurName = loueurDoc.exists()
        ? loueurDoc.data().displayName ||
          loueurDoc.data().email ||
          "Propriétaire"
        : "Propriétaire";

      console.log("📧 Email loueur:", loueurEmail);
      console.log("👤 Nom loueur:", loueurName);

      // Préparer les 2 emails
      const emailPromises = [];

      // 1️⃣ Email au locataire
      console.log("📧 Préparation email locataire:", locataireEmail);
      emailPromises.push(
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "reservation_confirmation_renter",
            renterEmail: locataireEmail,
            renterName: locataireNom,
            ownerName: loueurName,
            vehicleName: `${vehicle.marque} ${vehicle.modele}`,
            startDate: format(dateDebutAvecHeure, "dd/MM/yyyy à HH:mm", {
              locale: fr,
            }),
            endDate: format(dateFinAvecHeure, "dd/MM/yyyy à HH:mm", {
              locale: fr,
            }),
            totalPrice: prixTotal,
            reservationId: docRef.id,
          }),
        })
      );

      // 2️⃣ Email au loueur (propriétaire)
      if (loueurEmail) {
        console.log("📧 Préparation email loueur:", loueurEmail);
        emailPromises.push(
          fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "new_reservation_owner",
              ownerEmail: loueurEmail,
              ownerName: loueurName,
              renterName: locataireNom,
              vehicleName: `${vehicle.marque} ${vehicle.modele}`,
              startDate: format(dateDebutAvecHeure, "dd/MM/yyyy à HH:mm", {
                locale: fr,
              }),
              endDate: format(dateFinAvecHeure, "dd/MM/yyyy à HH:mm", {
                locale: fr,
              }),
              totalPrice: prixTotal,
              reservationId: docRef.id,
            }),
          })
        );
      } else {
        console.warn(
          "⚠️ Email du loueur introuvable pour userId:",
          vehicle.userId
        );
      }

      // Envoyer les emails en parallèle
      try {
        console.log("📤 Envoi des", emailPromises.length, "emails...");
        const emailResults = await Promise.all(emailPromises);

        emailResults.forEach((response, index) => {
          if (response.ok) {
            console.log(`✅ Email ${index + 1} envoyé avec succès`);
          } else {
            console.error(`❌ Erreur email ${index + 1}:`, response.status);
          }
        });

        console.log("✅ Tous les emails traités");
      } catch (emailError) {
        console.error("❌ Erreur envoi emails:", emailError);
        // On ne bloque pas la réservation si l'email échoue
      }

      setShowReservationModal(false);
      alert("✅ Réservation créée avec succès ! Vérifiez vos boîtes mail.");
      router.push("/espace-locataire");
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert(
        "❌ Erreur lors de la création de la réservation. Veuillez réessayer."
      );
    } finally {
      setSubmitting(false);
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

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Véhicule non trouvé</p>
          <Link
            href="/vehicules"
            className="text-green-600 hover:text-green-700"
          >
            Retour aux véhicules
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = calculatePrice();
  const nbJours =
    dateDebut && dateFin ? differenceInDays(dateFin, dateDebut) + 1 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold">
                SIIIIIR <span className="text-green-600">RENT</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-green-600 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Inscription
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galerie photos */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="relative h-96 bg-gray-200">
                {vehicle.photos && vehicle.photos.length > 0 ? (
                  <Image
                    src={vehicle.photos[selectedImage]}
                    alt={`${vehicle.marque} ${vehicle.modele}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-6xl">
                    🚗
                  </div>
                )}
              </div>

              {vehicle.photos && vehicle.photos.length > 1 && (
                <div className="grid grid-cols-5 gap-2 p-4">
                  {vehicle.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative h-20 rounded-lg overflow-hidden ${
                        selectedImage === index
                          ? "ring-2 ring-green-600"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Infos principales */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {vehicle.marque} {vehicle.modele}
              </h1>
              <p className="text-gray-600 mb-4">{vehicle.annee}</p>

              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <MapPin className="w-5 h-5" />
                <span>{vehicle.ville}</span>
                {vehicle.adresse && <span>• {vehicle.adresse}</span>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                <div className="text-center">
                  <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Places</p>
                  <p className="font-semibold text-gray-900">
                    {vehicle.places}
                  </p>
                </div>
                <div className="text-center">
                  <Settings className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Transmission</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {vehicle.transmission}
                  </p>
                </div>
                <div className="text-center">
                  <Fuel className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Carburant</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {vehicle.carburant}
                  </p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {vehicle.type}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Description
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {vehicle.description}
              </p>
            </div>

            {/* Équipements */}
            {vehicle.equipements && vehicle.equipements.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Équipements
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {vehicle.equipements.map((equipement, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      {equipement}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar réservation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-green-600">
                    {vehicle.prix}
                  </span>
                  <span className="text-gray-600">MAD / jour</span>
                </div>
              </div>

              {/* DatePicker */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <DatePicker
                    selected={dateDebut}
                    onChange={(date) => setDateDebut(date)}
                    selectsStart
                    startDate={dateDebut}
                    endDate={dateFin}
                    minDate={new Date()}
                    excludeDates={excludedDates}
                    dateFormat="dd/MM/yyyy"
                    locale={fr}
                    placeholderText="Sélectionnez une date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <DatePicker
                    selected={dateFin}
                    onChange={(date) => setDateFin(date)}
                    selectsEnd
                    startDate={dateDebut}
                    endDate={dateFin}
                    minDate={dateDebut || new Date()}
                    excludeDates={excludedDates}
                    dateFormat="dd/MM/yyyy"
                    locale={fr}
                    placeholderText="Sélectionnez une date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Récapitulatif prix */}
              {dateDebut && dateFin && nbJours > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {vehicle.prix} MAD × {nbJours} jour
                      {nbJours > 1 ? "s" : ""}
                    </span>
                    <span className="font-medium text-gray-900">
                      {totalPrice} MAD
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-green-600">{totalPrice} MAD</span>
                  </div>
                </div>
              )}

              {/* ✅ AVERTISSEMENT KYC NON VÉRIFIÉ */}
              {user && kycStatus !== "verified" && !loadingKyc && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Shield className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                        Vérification requise
                      </h3>
                      <p className="text-xs text-yellow-800 mb-3">
                        {kycStatus === "pending"
                          ? "Votre compte est en cours de vérification. Vous pourrez réserver dès que votre identité sera validée."
                          : kycStatus === "rejected"
                            ? "Votre vérification a été refusée. Veuillez soumettre de nouveaux documents depuis votre profil."
                            : "Vous devez faire vérifier votre identité pour effectuer une réservation."}
                      </p>
                      {kycStatus === "rejected" && (
                        <Link
                          href="/espace-locataire/profil"
                          className="inline-block text-xs text-yellow-900 font-medium underline hover:text-yellow-800"
                        >
                          Mettre à jour mes documents →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleOpenReservationModal}
                disabled={
                  !dateDebut ||
                  !dateFin ||
                  nbJours <= 0 ||
                  (user && kycStatus !== "verified") ||
                  loadingKyc
                }
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loadingKyc
                  ? "Chargement..."
                  : user && kycStatus !== "verified"
                    ? "Vérification requise"
                    : "Réserver maintenant"}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                {user && kycStatus !== "verified"
                  ? "Faites vérifier votre compte pour réserver"
                  : "Vous ne serez pas débité immédiatement"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Modal de réservation MODIFIÉ avec horaires et adresses */}
      {showReservationModal && dateDebut && dateFin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Finaliser la réservation
              </h2>
              <button
                onClick={() => setShowReservationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitReservation} className="space-y-4">
              {/* Informations personnelles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={locataireNom}
                  onChange={(e) => setLocataireNom(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Mohamed Alami"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={locataireEmail}
                  onChange={(e) => setLocataireEmail(e.target.value)}
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
                  value={locatairePhone}
                  onChange={(e) => setLocatairePhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>

              {/* ✅ NOUVEAUX CHAMPS : Horaires */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Horaires de prise en charge
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure de début *
                    </label>
                    <input
                      type="time"
                      value={heureDebut}
                      onChange={(e) => setHeureDebut(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure de fin *
                    </label>
                    <input
                      type="time"
                      value={heureFin}
                      onChange={(e) => setHeureFin(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* ✅ NOUVEAUX CHAMPS : Adresses */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Lieux de prise en charge
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse de départ *
                  </label>
                  <input
                    type="text"
                    value={adresseDepart}
                    onChange={(e) => setAdresseDepart(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ex: Aéroport Mohammed V, Casablanca"
                  />
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={memeAdresse}
                      onChange={(e) => setMemeAdresse(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">
                      Retour à la même adresse
                    </span>
                  </label>
                </div>

                {!memeAdresse && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse de retour *
                    </label>
                    <input
                      type="text"
                      value={adresseRetour}
                      onChange={(e) => setAdresseRetour(e.target.value)}
                      required={!memeAdresse}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: Gare Casa Voyageurs"
                    />
                  </div>
                )}
              </div>

              {/* Récapitulatif */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Récapitulatif
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Véhicule</span>
                    <span className="font-medium">
                      {vehicle.marque} {vehicle.modele}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Du</span>
                    <span className="font-medium">
                      {format(dateDebut, "dd MMM yyyy", { locale: fr })} à{" "}
                      {heureDebut}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Au</span>
                    <span className="font-medium">
                      {format(dateFin, "dd MMM yyyy", { locale: fr })} à{" "}
                      {heureFin}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>Total</span>
                    <span className="text-green-600">{totalPrice} MAD</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReservationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Envoi..." : "Confirmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
