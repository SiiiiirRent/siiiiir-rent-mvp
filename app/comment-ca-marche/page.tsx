"use client";

export default function CommentCaMarchePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="bg-green-600 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Comment ça marche ?</h1>
          <p className="text-lg opacity-90">
            SIIIIIR Rent simplifie la location de véhicules au Maroc.
            Réservation rapide, contrat digital, check-in sécurisé : tout est
            fluide.
          </p>
        </div>
      </section>

      {/* LOCATAIRE */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Pour les locataires 🚗
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Étape 1 */}
            <div className="p-6 border rounded-xl shadow-sm hover:shadow-md transition">
              <div className="text-green-600 font-bold text-xl mb-3">
                1. Rechercher
              </div>
              <p className="text-gray-600">
                Entrez vos dates et votre ville pour trouver un véhicule
                disponible parmi plusieurs loueurs vérifiés.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="p-6 border rounded-xl shadow-sm hover:shadow-md transition">
              <div className="text-green-600 font-bold text-xl mb-3">
                2. Réserver
              </div>
              <p className="text-gray-600">
                Choisissez votre voiture, envoyez votre demande et attendez la
                confirmation du loueur. Vous recevez ensuite votre contrat
                digital automatiquement.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="p-6 border rounded-xl shadow-sm hover:shadow-md transition">
              <div className="text-green-600 font-bold text-xl mb-3">
                3. Check-in & Récupération
              </div>
              <p className="text-gray-600">
                Le jour J, vous remplissez l’état des lieux via l’application.
                Le loueur valide, et vous partez sereinement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LOUEUR */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Pour les loueurs 🔑
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Étape 1 */}
            <div className="p-6 border rounded-xl shadow-sm hover:shadow-md transition bg-white">
              <div className="text-green-600 font-bold text-xl mb-3">
                1. Ajouter vos véhicules
              </div>
              <p className="text-gray-600">
                Importez vos voitures, fourgonnettes, scooters, engins BTP, etc.
                Ajoutez photos, prix et conditions.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="p-6 border rounded-xl shadow-sm hover:shadow-md transition bg-white">
              <div className="text-green-600 font-bold text-xl mb-3">
                2. Gérer les demandes
              </div>
              <p className="text-gray-600">
                Recevez les demandes de réservation, consultez les profils des
                locataires et confirmez les réservations en un clic.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="p-6 border rounded-xl shadow-sm hover:shadow-md transition bg-white">
              <div className="text-green-600 font-bold text-xl mb-3">
                3. Check-in, contrat & paiement
              </div>
              <p className="text-gray-600">
                Le contrat PDF est généré automatiquement. Vous validez le
                check-in/check-out et archivez tout automatiquement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ RAPIDE */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Questions fréquentes (FAQ)
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                Est-ce que SIIIIIR Rent est gratuit ?
              </h3>
              <p className="text-gray-600">
                Oui pendant la CAN. Ensuite, une commission ou un abonnement
                s'appliquent pour les loueurs.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                Comment sont validés les profils ?
              </h3>
              <p className="text-gray-600">
                Les locataires doivent fournir CIN/passeport + permis. Les
                loueurs doivent valider leurs informations professionnelles.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                Comment se passe le contrat ?
              </h3>
              <p className="text-gray-600">
                Le contrat PDF est généré automatiquement avec les informations
                exactes de la réservation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
