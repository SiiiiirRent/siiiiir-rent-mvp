"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Check, X, ArrowLeft } from "lucide-react";

export default function KycDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUser({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateKYC = async () => {
    if (!confirm("Voulez-vous vraiment valider le KYC de cet utilisateur ?")) {
      return;
    }

    try {
      setProcessing(true);

      // 1. Mettre à jour Firestore
      await updateDoc(doc(db, "users", userId), {
        kycStatus: "verified",
        isVerified: true,
        "documents.cni.verified": true,
        "documents.permis.verified": true,
        verifiedAt: new Date(),
      });

      // 2. Envoyer email à l'utilisateur
      try {
        await fetch("/api/notify-user-kyc-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            status: "verified",
          }),
        });
        console.log("📧 Email de validation envoyé à l'utilisateur");
      } catch (emailError) {
        console.warn("⚠️ Email non envoyé (pas bloquant):", emailError);
      }

      alert(
        "✅ KYC validé avec succès ! Un email a été envoyé à l'utilisateur."
      );
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Erreur:", error);
      alert("❌ Erreur lors de la validation");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectKYC = async () => {
    const reason = prompt("Raison du refus (sera envoyée à l'utilisateur) :");
    if (!reason) return;

    try {
      setProcessing(true);

      // 1. Mettre à jour Firestore
      await updateDoc(doc(db, "users", userId), {
        kycStatus: "rejected",
        isVerified: false,
        rejectionReason: reason,
        rejectedAt: new Date(),
      });

      // 2. Envoyer email à l'utilisateur
      try {
        await fetch("/api/notify-user-kyc-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            status: "rejected",
            reason: reason,
          }),
        });
        console.log("📧 Email de refus envoyé à l'utilisateur");
      } catch (emailError) {
        console.warn("⚠️ Email non envoyé (pas bloquant):", emailError);
      }

      alert("❌ KYC refusé. Un email a été envoyé à l'utilisateur.");
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Erreur:", error);
      alert("❌ Erreur lors du refus");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">❌ Utilisateur introuvable</p>
      </div>
    );
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("fr-FR");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vérification KYC</h1>
          <p className="text-gray-600 mt-1">
            {user.prenom} {user.nom}
          </p>
        </div>
      </div>

      {/* Informations utilisateur */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📋 Informations Personnelles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Nom complet</p>
            <p className="font-semibold text-gray-900">
              {user.prenom} {user.nom}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Téléphone</p>
            <p className="font-semibold text-gray-900">
              {user.telephone || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Type de compte</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                user.role === "loueur"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {user.role === "loueur" ? "💼 Loueur" : "🚗 Locataire"}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Adresse</p>
            <p className="font-semibold text-gray-900">
              {user.adresse || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ville</p>
            <p className="font-semibold text-gray-900">{user.ville || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pays</p>
            <p className="font-semibold text-gray-900">{user.pays || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date d'inscription</p>
            <p className="font-semibold text-gray-900">
              {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Documents CIN */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🆔 CIN / Passeport
        </h2>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Numéro</p>
          <p className="font-semibold text-gray-900 font-mono">
            {user.numeroCIN || "N/A"}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.documents?.cni?.recto && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Recto</p>
              <img
                src={user.documents.cni.recto}
                alt="CIN Recto"
                className="w-full h-64 object-contain bg-gray-100 rounded-lg border"
              />
            </div>
          )}
          {user.documents?.cni?.verso && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Verso</p>
              <img
                src={user.documents.cni.verso}
                alt="CIN Verso"
                className="w-full h-64 object-contain bg-gray-100 rounded-lg border"
              />
            </div>
          )}
        </div>
      </div>

      {/* Documents Permis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🪪 Permis de Conduire
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Numéro</p>
            <p className="font-semibold text-gray-900 font-mono">
              {user.numeroPermis || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date de validité</p>
            <p className="font-semibold text-gray-900">
              {formatDate(user.dateValiditePermis)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.documents?.permis?.recto && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Recto</p>
              <img
                src={user.documents.permis.recto}
                alt="Permis Recto"
                className="w-full h-64 object-contain bg-gray-100 rounded-lg border"
              />
            </div>
          )}
          {user.documents?.permis?.verso && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Verso</p>
              <img
                src={user.documents.permis.verso}
                alt="Permis Verso"
                className="w-full h-64 object-contain bg-gray-100 rounded-lg border"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Actions</h2>
        <div className="flex gap-4">
          <button
            onClick={handleValidateKYC}
            disabled={processing}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            Valider le KYC
          </button>
          <button
            onClick={handleRejectKYC}
            disabled={processing}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            Refuser le KYC
          </button>
        </div>
      </div>
    </div>
  );
}
