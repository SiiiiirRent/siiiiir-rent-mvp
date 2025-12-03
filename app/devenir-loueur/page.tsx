"use client";

import Link from "next/link";
import { Car, Shield, ClipboardCheck, Clock } from "lucide-react";

export default function DevenirLoueurPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* HEADER */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">
          Devenir loueur sur{" "}
          <span className="text-green-600">SIIIIIR Rent</span>
        </h1>
        <p className="text-gray-600 text-lg text-center max-w-2xl mx-auto mb-12">
          Rejoignez la plateforme de location la plus simple et la plus rapide
          du Maroc. Gérez vos réservations, vos véhicules et vos clients en
          toute simplicité.
        </p>

        {/* AVANTAGES */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-50 border rounded-xl p-6 text-center shadow-sm">
            <Car className="w-10 h-10 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 text-lg mb-2">
              1. Ajoutez vos véhicules
            </h3>
            <p className="text-gray-600 text-sm">
              Photos, prix, options… Créez vos fiches véhicules en quelques
              minutes.
            </p>
          </div>

          <div className="bg-gray-50 border rounded-xl p-6 text-center shadow-sm">
            <ClipboardCheck className="w-10 h-10 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 text-lg mb-2">
              2. Recevez des réservations
            </h3>
            <p className="text-gray-600 text-sm">
              Les locataires choisissent votre véhicule et vous recevez une
              demande instantanée.
            </p>
          </div>

          <div className="bg-gray-50 border rounded-xl p-6 text-center shadow-sm">
            <Shield className="w-10 h-10 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 text-lg mb-2">
              3. Sécurisez vos locations
            </h3>
            <p className="text-gray-600 text-sm">
              Check-in / check-out avec photos et PDF automatique. Plus de
              litiges.
            </p>
          </div>
        </div>

        {/* SECTION FREE MVP */}
        <div className="bg-green-600 text-white rounded-2xl p-10 mb-16 shadow-xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            💸 100% gratuit pendant la CAN 2025
          </h2>
          <p className="text-lg text-green-100 mb-6">
            Aucun abonnement, aucune commission. Profitez du lancement national
            pour remplir votre calendrier de réservations.
          </p>
        </div>

        {/* COMMENT DEVENIR LOUEUR */}
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Comment devenir loueur ?
        </h2>

        <div className="space-y-6 max-w-3xl mx-auto mb-12">
          <div className="bg-gray-50 border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">
              1. Créez votre compte
            </h3>
            <p className="text-gray-600 text-sm">
              Inscrivez-vous en quelques secondes. Une simple adresse email
              suffit.
            </p>
          </div>

          <div className="bg-gray-50 border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">
              2. Validez votre profil
            </h3>
            <p className="text-gray-600 text-sm">
              Ajoutez votre CIN/passeport + votre permis. Nous validons votre
              KYC.
            </p>
          </div>

          <div className="bg-gray-50 border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">
              3. Ajoutez vos véhicules
            </h3>
            <p className="text-gray-600 text-sm">
              Photos, prix, ville, options… Votre véhicule apparaît
              instantanément sur la plateforme.
            </p>
          </div>

          <div className="bg-gray-50 border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">
              4. Recevez vos premières réservations
            </h3>
            <p className="text-gray-600 text-sm">
              Vous recevez un email + une notification. Vous acceptez ou refusez
              en un clic.
            </p>
          </div>
        </div>

        {/* CTA BUTTON */}
        <div className="text-center">
          <Link
            href="/register"
            className="inline-block bg-green-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition"
          >
            Créer mon compte loueur
          </Link>

          <p className="text-gray-500 text-sm mt-3">
            Temps nécessaire : moins de 2 minutes ⏱️
          </p>
        </div>
      </div>
    </div>
  );
}
