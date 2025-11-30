"use client";

import { useState } from "react";

export default function TestEmailsPage() {
  const [email, setEmail] = useState("contact@siiiiirrent.com");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  async function testNewReservationEmail() {
    if (!email) {
      setResult("❌ Veuillez entrer un email");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new_reservation_owner",
          ownerEmail: email,
          ownerName: "Aimad Ben Hammi",
          renterName: "Mohamed Test",
          vehicleName: "Volkswagen Golf GTI",
          startDate: "20/11/2025",
          endDate: "25/11/2025",
          totalPrice: 1750,
          reservationId: "test123",
        }),
      });

      if (response.ok) {
        setResult("✅ Email de nouvelle réservation envoyé avec succès !");
      } else {
        setResult("❌ Erreur lors de l'envoi de l'email");
      }
    } catch (error) {
      console.error(error);
      setResult("❌ Erreur : " + error);
    } finally {
      setLoading(false);
    }
  }

  async function testConfirmationEmail() {
    if (!email) {
      setResult("❌ Veuillez entrer un email");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reservation_confirmation_renter",
          renterEmail: email,
          renterName: "Aimad Ben Hammi",
          ownerName: "Propriétaire Test",
          vehicleName: "Volkswagen Golf GTI",
          startDate: "20/11/2025",
          endDate: "25/11/2025",
          totalPrice: 1750,
          reservationId: "test123",
        }),
      });

      if (response.ok) {
        setResult("✅ Email de confirmation envoyé avec succès !");
      } else {
        setResult("❌ Erreur lors de l'envoi de l'email");
      }
    } catch (error) {
      console.error(error);
      setResult("❌ Erreur : " + error);
    } finally {
      setLoading(false);
    }
  }

  async function testPaymentEmail() {
    if (!email) {
      setResult("❌ Veuillez entrer un email");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment_confirmation",
          recipientEmail: email,
          recipientName: "Aimad Ben Hammi",
          amount: 1750,
          paymentMethod: "Espèces",
          vehicleName: "Volkswagen Golf GTI",
          reservationId: "test123",
        }),
      });

      if (response.ok) {
        setResult("✅ Email de paiement envoyé avec succès !");
      } else {
        setResult("❌ Erreur lors de l'envoi de l'email");
      }
    } catch (error) {
      console.error(error);
      setResult("❌ Erreur : " + error);
    } finally {
      setLoading(false);
    }
  }

  async function testReminderEmail() {
    if (!email) {
      setResult("❌ Veuillez entrer un email");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reminder",
          recipientEmail: email,
          recipientName: "Aimad Ben Hammi",
          vehicleName: "Volkswagen Golf GTI",
          startDate: "Demain à 10h00",
          pickupLocation: "Casablanca, Boulevard Mohammed V",
        }),
      });

      if (response.ok) {
        setResult("✅ Email de rappel envoyé avec succès !");
      } else {
        setResult("❌ Erreur lors de l'envoi de l'email");
      }
    } catch (error) {
      console.error(error);
      setResult("❌ Erreur : " + error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">🧪 Test des emails</h1>
        <p className="text-gray-600 mt-2">
          Testez l'envoi des différents types d'emails
        </p>
      </div>

      {/* Champ email */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📧 Email de réception (entrez votre vrai email)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@siiiiirrent.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-500 mt-2">
          Les emails de test seront envoyés à cette adresse
        </p>
      </div>

      {/* Résultat */}
      {result && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            result.startsWith("✅")
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {result}
        </div>
      )}

      {/* Boutons de test */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            📧 Nouvelle réservation (Loueur)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Email envoyé au propriétaire quand il reçoit une nouvelle
            réservation
          </p>
          <button
            onClick={testNewReservationEmail}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Envoi..." : "Tester"}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            ✅ Confirmation réservation (Locataire)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Email de confirmation envoyé au locataire après sa réservation
          </p>
          <button
            onClick={testConfirmationEmail}
            disabled={loading}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Envoi..." : "Tester"}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            💰 Confirmation paiement
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Email envoyé après la réception d'un paiement
          </p>
          <button
            onClick={testPaymentEmail}
            disabled={loading}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Envoi..." : "Tester"}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-2">⏰ Rappel 24h</h3>
          <p className="text-sm text-gray-600 mb-4">
            Email de rappel envoyé 24h avant le début de la location
          </p>
          <button
            onClick={testReminderEmail}
            disabled={loading}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Envoi..." : "Tester"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Note :</strong> Les emails sont envoyés depuis{" "}
          <code>onboarding@resend.dev</code>. Plus tard, tu pourras configurer
          ton propre domaine pour envoyer depuis{" "}
          <code>contact@siiiiirrent.com</code>
        </p>
      </div>
    </div>
  );
}
