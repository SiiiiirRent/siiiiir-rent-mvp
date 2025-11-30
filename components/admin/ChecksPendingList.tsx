"use client";

interface Reservation {
  id: string;
  vehicleMarque?: string;
  vehicleModele?: string;
  locataireNom?: string;
  loueurNom?: string;
  checkStatus?: string;
  dateDebut?: any;
}

interface ChecksPendingListProps {
  reservations: Reservation[];
}

export default function ChecksPendingList({
  reservations,
}: ChecksPendingListProps) {
  const checkinPending = reservations.filter(
    (r) => r.checkStatus === "checkin_en_attente_validation"
  );
  const checkoutPending = reservations.filter(
    (r) => r.checkStatus === "checkout_en_attente_validation"
  );

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("fr-FR");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Check-in en attente */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              📸 Check-in à Valider
            </h2>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
              {checkinPending.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {checkinPending.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ✅ Aucun check-in en attente
            </div>
          ) : (
            checkinPending.slice(0, 10).map((reservation) => (
              <div key={reservation.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {reservation.vehicleMarque} {reservation.vehicleModele}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Locataire: {reservation.locataireNom || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Début: {formatDate(reservation.dateDebut)}
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">
                    Valider
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Check-out en attente */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              📸 Check-out à Valider
            </h2>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
              {checkoutPending.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {checkoutPending.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ✅ Aucun check-out en attente
            </div>
          ) : (
            checkoutPending.slice(0, 10).map((reservation) => (
              <div key={reservation.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {reservation.vehicleMarque} {reservation.vehicleModele}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Locataire: {reservation.locataireNom || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Début: {formatDate(reservation.dateDebut)}
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">
                    Valider
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
