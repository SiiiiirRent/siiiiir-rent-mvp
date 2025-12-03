"use client";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-10 text-center">
          Foire aux Questions (FAQ)
        </h1>

        <div className="space-y-8">
          {/* Question 1 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Comment fonctionne la location sur SIIIIIR Rent ?
            </h2>
            <p className="text-gray-700">
              Vous choisissez un véhicule, vous réservez vos dates, puis le
              loueur valide votre demande. Le jour J, vous effectuez un check-in
              (état des lieux d’entrée), puis un check-out au retour du
              véhicule.
            </p>
          </div>

          {/* Question 2 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Le paiement se fait comment ?
            </h2>
            <p className="text-gray-700">
              Pour le moment, tous les paiements se font **en cash directement
              auprès du loueur**. L’application sert uniquement à sécuriser la
              réservation, gérer les états des lieux et simplifier le suivi.
            </p>
          </div>

          {/* Question 3 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Est-ce que je dois payer en avance ?
            </h2>
            <p className="text-gray-700">
              Non. Le paiement se fait le jour de la remise du véhicule, une
              fois le check-in validé entre vous et le loueur.
            </p>
          </div>

          {/* Question 4 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Comment se déroule le check-in ?
            </h2>
            <p className="text-gray-700">
              Vous prenez des photos du véhicule via un lien sécurisé ou depuis
              l’application. Ces photos sont automatiquement sauvegardées dans
              le dossier de la réservation. Le loueur valide ensuite le
              check-in.
            </p>
          </div>

          {/* Question 5 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Comment se déroule le check-out ?
            </h2>
            <p className="text-gray-700">
              À la fin de la location, un nouvel état des lieux est effectué.
              Les photos d’entrée et de sortie sont comparées afin de garantir
              une totale transparence entre le loueur et le locataire.
            </p>
          </div>

          {/* Question 6 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Est-ce que SIIIIIR Rent facture des frais ?
            </h2>
            <p className="text-gray-700">
              Non, le service est totalement gratuit pendant la phase de
              lancement (CAN 2025). Aucune commission ni abonnement n’est
              appliqué sur les réservations durant cette période.
            </p>
          </div>

          {/* Question 7 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Est-ce que mes documents sont obligatoires ?
            </h2>
            <p className="text-gray-700">
              Oui. Pour votre sécurité, vous devez fournir votre
              **CIN/passeport** et votre **permis**. Le loueur doit aussi
              valider votre profil dans le cadre du KYC.
            </p>
          </div>

          {/* Question 8 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Comment contacter un loueur ?
            </h2>
            <p className="text-gray-700">
              Vous pouvez le contacter directement via WhatsApp, téléphone ou
              email depuis la page du véhicule ou de la réservation.
            </p>
          </div>

          {/* Question 9 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Puis-je annuler une réservation ?
            </h2>
            <p className="text-gray-700">
              Oui. Tant que le loueur n’a pas confirmé la réservation, vous
              pouvez l’annuler gratuitement. Si elle est déjà confirmée, vous
              devez contacter le loueur directement pour voir avec lui.
            </p>
          </div>

          {/* Question 10 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Est-ce que SIIIIIR Rent est une agence ?
            </h2>
            <p className="text-gray-700">
              Non. SIIIIIR Rent est une **plateforme de mise en relation** entre
              loueurs professionnels/particuliers et locataires. Le contrat, le
              paiement et la caution restent entre vous et le loueur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
