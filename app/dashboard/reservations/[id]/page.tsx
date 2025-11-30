"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { Reservation, Vehicle, Payment } from "@/lib/types";
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Car,
  DollarSign,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  AlertCircle,
  Clipboard,
} from "lucide-react";
import ContractSection from "@/components/ContractSection";
import { useAuth } from "@/context/AuthContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateReceiptPDF } from "@/lib/generateReceiptPDF";

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reservationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [locataireProfile, setLocataireProfile] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadReservation();
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      const reservationDoc = await getDoc(
        doc(db, "reservations", reservationId)
      );

      if (reservationDoc.exists()) {
        const reservationData = {
          id: reservationDoc.id,
          ...reservationDoc.data(),
        } as Reservation;
        setReservation(reservationData);

        // Charger le véhicule
        const vehicleDoc = await getDoc(
          doc(db, "vehicles", reservationData.vehicleId)
        );
        if (vehicleDoc.exists()) {
          setVehicle({
            id: vehicleDoc.id,
            ...vehicleDoc.data(),
          } as Vehicle);
        }

        // Charger le profil du locataire
        if (reservationData.locataireId) {
          const locataireDoc = await getDoc(
            doc(db, "users", reservationData.locataireId)
          );
          if (locataireDoc.exists()) {
            setLocataireProfile(locataireDoc.data());
          }
        }
      }
    } catch (error) {
      console.error("Erreur chargement réservation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!reservation || reservation.status !== "en_attente") return;

    if (!confirm("Confirmer cette réservation ?")) return;

    try {
      await updateDoc(doc(db, "reservations", reservation.id), {
        status: "confirmee",
        updatedAt: Timestamp.now(),
      });

      console.log("✅ Réservation confirmée dans Firestore");

      const loueurName = user?.displayName || user?.email || "Propriétaire";

      console.log(
        "📧 Envoi email de confirmation au locataire:",
        reservation.locataireEmail
      );

      const emailResponse = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reservation_confirmation_renter",
          renterEmail: reservation.locataireEmail,
          renterName: reservation.locataireNom,
          ownerName: loueurName,
          vehicleName: `${vehicle?.marque} ${vehicle?.modele}`,
          startDate: new Date(
            reservation.dateDebut.toDate
              ? reservation.dateDebut.toDate()
              : reservation.dateDebut
          ).toLocaleDateString("fr-FR"),
          endDate: new Date(
            reservation.dateFin.toDate
              ? reservation.dateFin.toDate()
              : reservation.dateFin
          ).toLocaleDateString("fr-FR"),
          totalPrice: reservation.prixTotal,
          reservationId: reservation.id,
        }),
      });

      if (emailResponse.ok) {
        console.log("✅ Email envoyé avec succès au locataire");
        alert("Réservation confirmée avec succès ! Email envoyé au locataire.");
      } else {
        console.error("❌ Erreur envoi email:", emailResponse.status);
        alert("Réservation confirmée, mais erreur lors de l'envoi de l'email.");
      }

      loadReservation();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la confirmation");
    }
  };

  const handleConfirmPayment = async () => {
    if (!user || !reservation) return;

    setProcessing(true);

    try {
      const paymentId = `payment_${reservation.id}_${Date.now()}`;

      const payment: Payment = {
        id: paymentId,
        reservationId: reservation.id,
        montant: reservation.prixTotal,
        methode: "cash",
        status: "paye",
        payePar: reservation.locataireNom,
        recuPar: user.uid,
        dateCreation: Timestamp.now(),
        datePaiement: Timestamp.now(),
        notes: notes || undefined,
      };

      const pdfBlob = await generateReceiptPDF({
        reservation,
        payment,
        loueurNom: user.displayName || user.email || "Loueur",
      });

      const timestamp = Date.now();
      const fileName = `recu_paiement_${timestamp}.pdf`;
      const filePath = `receipts/${reservation.id}/${fileName}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, pdfBlob);
      const pdfURL = await getDownloadURL(storageRef);

      payment.recuPdfUrl = pdfURL;

      await setDoc(doc(db, "payments", paymentId), payment);

      await updateDoc(doc(db, "reservations", reservation.id), {
        paymentStatus: "paye",
        paymentId: paymentId,
        updatedAt: Timestamp.now(),
      });

      alert("Paiement confirmé avec succès ! Reçu généré.");
      setShowModal(false);
      loadReservation();
    } catch (error) {
      console.error("Erreur confirmation paiement:", error);
      alert("Erreur lors de la confirmation du paiement");
    } finally {
      setProcessing(false);
    }
  };

  const handleViewReceipt = async () => {
    if (reservation?.paymentId) {
      try {
        const paymentDoc = doc(db, "payments", reservation.paymentId);
        const paymentSnap = await getDoc(paymentDoc);

        if (paymentSnap.exists()) {
          const payment = paymentSnap.data() as Payment;
          if (payment.recuPdfUrl) {
            window.open(payment.recuPdfUrl, "_blank");
          }
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  const handleDownloadReceipt = async () => {
    if (reservation?.paymentId) {
      try {
        const paymentDoc = doc(db, "payments", reservation.paymentId);
        const paymentSnap = await getDoc(paymentDoc);

        if (paymentSnap.exists()) {
          const payment = paymentSnap.data() as Payment;
          if (payment.recuPdfUrl) {
            const link = document.createElement("a");
            link.href = payment.recuPdfUrl;
            link.download = `recu_${reservation.id}.pdf`;
            link.click();
          }
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert(`✅ ${label} copié dans le presse-papier !`);
        return;
      }

      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      textArea.remove();

      if (successful) {
        alert(`✅ ${label} copié dans le presse-papier !`);
      } else {
        throw new Error("Copie échouée");
      }
    } catch (err) {
      console.error("❌ Erreur copie:", err);
      prompt(`Copiez ce lien manuellement (${label}) :`, text);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!reservation || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Réservation non trouvée</p>
          <button
            onClick={() => router.back()}
            className="text-green-600 hover:text-green-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      en_attente: "bg-yellow-100 text-yellow-800",
      confirmee: "bg-blue-100 text-blue-800",
      en_cours: "bg-green-100 text-green-800",
      terminee: "bg-gray-100 text-gray-800",
      annulee: "bg-red-100 text-red-800",
    };

    const labels = {
      en_attente: "En attente",
      confirmee: "Confirmée",
      en_cours: "En cours",
      terminee: "Terminée",
      annulee: "Annulée",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          styles[status as keyof typeof styles]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const isPaid = reservation.paymentStatus === "paye";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Réservation #{reservation.id.slice(0, 8)}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {getStatusBadge(reservation.status)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info véhicule */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-green-600" />
                Véhicule
              </h2>
              <div className="flex gap-4">
                {vehicle.photos?.[0] && (
                  <img
                    src={vehicle.photos[0]}
                    alt={`${vehicle.marque} ${vehicle.modele}`}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {vehicle.marque} {vehicle.modele}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{vehicle.annee}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {vehicle.ville}
                  </div>
                </div>
              </div>
            </div>

            {/* Dates et prix */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Dates et tarif
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Date de début</span>
                  <span className="font-medium text-gray-900">
                    {new Date(
                      reservation.dateDebut.toDate
                        ? reservation.dateDebut.toDate()
                        : reservation.dateDebut
                    ).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Date de fin</span>
                  <span className="font-medium text-gray-900">
                    {new Date(
                      reservation.dateFin.toDate
                        ? reservation.dateFin.toDate()
                        : reservation.dateFin
                    ).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Durée</span>
                  <span className="font-medium text-gray-900">
                    {reservation.nbJours} jour(s)
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-gray-600">Prix par jour</span>
                  <span className="font-medium text-gray-900">
                    {reservation.vehiclePrixJour} MAD
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    Prix total
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {reservation.prixTotal} MAD
                  </span>
                </div>
              </div>
            </div>

            {/* Info locataire */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Locataire
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">
                    {reservation.locataireNom}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">
                    {reservation.locataireEmail}
                  </span>
                </div>
                {reservation.locatairePhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">
                      {reservation.locatairePhone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Informations complètes du locataire */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Informations complètes du locataire
              </h2>

              <div className="space-y-6">
                {/* Infos personnelles */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Identité
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Nom complet</p>
                      <p className="font-medium text-gray-900">
                        {reservation.locataireNom}
                      </p>
                    </div>

                    {locataireProfile?.prenom && (
                      <div>
                        <p className="text-gray-600">Prénom</p>
                        <p className="font-medium text-gray-900">
                          {locataireProfile.prenom}
                        </p>
                      </div>
                    )}

                    {locataireProfile?.dateNaissance && (
                      <div>
                        <p className="text-gray-600">Date de naissance</p>
                        <p className="font-medium text-gray-900">
                          {new Date(
                            locataireProfile.dateNaissance.toDate
                              ? locataireProfile.dateNaissance.toDate()
                              : locataireProfile.dateNaissance
                          ).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    )}

                    {locataireProfile?.numeroCIN && (
                      <div>
                        <p className="text-gray-600">CIN/Passeport</p>
                        <p className="font-medium text-gray-900">
                          {locataireProfile.numeroCIN}
                        </p>
                      </div>
                    )}

                    {locataireProfile?.adresse && (
                      <div className="col-span-2">
                        <p className="text-gray-600">Adresse</p>
                        <p className="font-medium text-gray-900">
                          {locataireProfile.adresse}
                        </p>
                      </div>
                    )}

                    {locataireProfile?.ville && (
                      <div>
                        <p className="text-gray-600">Ville</p>
                        <p className="font-medium text-gray-900">
                          {locataireProfile.ville}
                        </p>
                      </div>
                    )}

                    {locataireProfile?.codePostal && (
                      <div>
                        <p className="text-gray-600">Code postal</p>
                        <p className="font-medium text-gray-900">
                          {locataireProfile.codePostal}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Permis de conduire */}
                {(locataireProfile?.numeroPermis ||
                  locataireProfile?.dateValiditePermis) && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Permis de conduire
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {locataireProfile?.numeroPermis && (
                        <div>
                          <p className="text-gray-600">Numéro de permis</p>
                          <p className="font-medium text-gray-900">
                            {locataireProfile.numeroPermis}
                          </p>
                        </div>
                      )}

                      {locataireProfile?.dateValiditePermis && (
                        <div>
                          <p className="text-gray-600">Validité</p>
                          <p className="font-medium text-gray-900">
                            {new Date(
                              locataireProfile.dateValiditePermis.toDate
                                ? locataireProfile.dateValiditePermis.toDate()
                                : locataireProfile.dateValiditePermis
                            ).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Photos des documents */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Documents
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Photo CNI/Passeport */}
                    {locataireProfile?.cinPhotoURL && (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">
                          Photo CIN/Passeport
                        </p>
                        <a
                          href={locataireProfile.cinPhotoURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={locataireProfile.cinPhotoURL}
                            alt="CIN/Passeport"
                            className="w-full h-48 object-contain rounded-lg border-2 border-gray-200 hover:border-green-500 transition cursor-pointer bg-gray-50"
                          />
                        </a>
                      </div>
                    )}

                    {/* Photo Permis */}
                    {locataireProfile?.permisPhotoURL && (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">
                          Photo Permis de conduire
                        </p>
                        <a
                          href={locataireProfile.permisPhotoURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={locataireProfile.permisPhotoURL}
                            alt="Permis"
                            className="w-full h-48 object-contain rounded-lg border-2 border-gray-200 hover:border-green-500 transition cursor-pointer bg-gray-50"
                          />
                        </a>
                      </div>
                    )}
                  </div>

                  {!locataireProfile?.cinPhotoURL &&
                    !locataireProfile?.permisPhotoURL && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Aucun document uploadé
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Bouton Confirmer réservation */}
            {reservation.status === "en_attente" && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  Action requise
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Cette réservation est en attente de votre confirmation.
                </p>
                <button
                  onClick={handleConfirmReservation}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirmer la réservation
                </button>
              </div>
            )}

            {/* Contrat */}
            <ContractSection
              reservation={reservation}
              onUpdate={loadReservation}
            />

            {/* États des lieux */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                États des lieux
              </h2>

              <div className="space-y-4">
                {/* CHECK-IN */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      État des lieux - Entrée
                    </h3>

                    {reservation.checkin?.validatedAt ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        ✅ Validé
                      </span>
                    ) : reservation.checkin ? (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                        ⏳ En attente de validation
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                        📝 Non fait
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    À remplir avant la remise des clés
                  </p>

                  {reservation.checkin?.validatedAt ? (
                    <div className="space-y-2">
                      <button
                        onClick={() =>
                          window.open(reservation.checkin?.pdfUrl, "_blank")
                        }
                        className="w-full bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
                      >
                        📄 Voir le PDF check-in
                      </button>
                    </div>
                  ) : reservation.checkin ? (
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/reservations/${reservation.id}/validate-checkin`
                        )
                      }
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium text-sm"
                    >
                      ✅ Valider le check-in
                    </button>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-xs text-blue-800">
                        <strong>Lien à envoyer au locataire :</strong>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={`${typeof window !== "undefined" ? window.location.origin : ""}/checkin/${reservation.id}`}
                          readOnly
                          className="flex-1 text-xs px-2 py-1 border border-blue-300 rounded bg-white"
                        />
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `${typeof window !== "undefined" ? window.location.origin : ""}/checkin/${reservation.id}`,
                              "Lien check-in"
                            )
                          }
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Clipboard className="w-3 h-3" />
                          Copier
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CHECK-OUT */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      État des lieux - Sortie
                    </h3>

                    {reservation.checkout?.validatedAt ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        ✅ Validé
                      </span>
                    ) : reservation.checkout ? (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                        ⏳ En attente de validation
                      </span>
                    ) : reservation.checkin?.validatedAt ? (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                        📝 Pas encore
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-300 text-gray-600 text-xs rounded-full font-medium">
                        🔒 Faire le check-in d&apos;abord
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    À remplir au retour du véhicule
                  </p>

                  {reservation.checkout?.validatedAt ? (
                    <div className="space-y-2">
                      <button
                        onClick={() =>
                          window.open(reservation.checkout?.pdfUrl, "_blank")
                        }
                        className="w-full bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
                      >
                        📄 Voir le PDF check-out
                      </button>
                    </div>
                  ) : reservation.checkout ? (
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/reservations/${reservation.id}/validate-checkout`
                        )
                      }
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium text-sm"
                    >
                      ✅ Valider le check-out
                    </button>
                  ) : reservation.checkin?.validatedAt ? (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-xs text-blue-800">
                        <strong>Lien à envoyer au locataire :</strong>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={`${typeof window !== "undefined" ? window.location.origin : ""}/checkout/${reservation.id}`}
                          readOnly
                          className="flex-1 text-xs px-2 py-1 border border-blue-300 rounded bg-white"
                        />
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `${typeof window !== "undefined" ? window.location.origin : ""}/checkout/${reservation.id}`,
                              "Lien check-out"
                            )
                          }
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Clipboard className="w-3 h-3" />
                          Copier
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <p className="text-xs text-gray-600 text-center">
                        Le check-in doit être validé avant de faire le check-out
                      </p>
                    </div>
                  )}
                </div>

                {!reservation.checkin && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Conseil :</strong> Remplissez l&apos;état des
                      lieux d&apos;entrée avec le locataire avant de remettre
                      les clés. Cela protège les deux parties.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Paiement */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Paiement
              </h3>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Statut</span>
                  <div className="flex items-center gap-2">
                    {isPaid ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Payé
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          Non payé
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Montant total</span>
                  <span className="text-xl font-bold text-gray-900">
                    {reservation.prixTotal.toFixed(2)} MAD
                  </span>
                </div>
              </div>

              {!isPaid && reservation.status === "confirmee" && (
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-5 h-5" />
                  Confirmer le paiement cash
                </button>
              )}

              {isPaid && (
                <div className="space-y-2">
                  <button
                    onClick={handleViewReceipt}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Voir le reçu
                  </button>
                  <button
                    onClick={handleDownloadReceipt}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le reçu
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation paiement */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirmer le paiement cash
            </h3>

            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Locataire</span>
                  <span className="font-medium text-gray-900">
                    {reservation.locataireNom}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Montant</span>
                  <span className="text-2xl font-bold text-green-600">
                    {reservation.prixTotal.toFixed(2)} MAD
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des notes sur ce paiement..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Confirmation...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
