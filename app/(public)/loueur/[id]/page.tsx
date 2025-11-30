"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle, UserProfile } from "@/lib/types";
import { MapPin, Star, Phone, Search, Calendar } from "lucide-react";

export default function LoueurPublicPage() {
  const params = useParams();
  const router = useRouter();
  const loueurId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [loueur, setLoueur] = useState<UserProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [unavailableVehicleIds, setUnavailableVehicleIds] = useState<
    Set<string>
  >(new Set());

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [dateDebutFilter, setDateDebutFilter] = useState("");
  const [dateFinFilter, setDateFinFilter] = useState("");
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (loueurId) {
      void loadLoueurData();
    }
  }, [loueurId]);

  useEffect(() => {
    if (dateDebutFilter && dateFinFilter) {
      void checkVehiclesAvailability();
    } else {
      setUnavailableVehicleIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateDebutFilter, dateFinFilter, vehicles]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    vehicles,
    searchTerm,
    selectedType,
    priceRange,
    unavailableVehicleIds,
    dateDebutFilter,
    dateFinFilter,
    dateError,
  ]);

  const loadLoueurData = async () => {
    try {
      setLoading(true);
      const loueurDoc = await getDoc(doc(db, "users", loueurId));

      if (loueurDoc.exists()) {
        setLoueur({ uid: loueurDoc.id, ...loueurDoc.data() } as UserProfile);
      }

      const vehiclesQuery = query(
        collection(db, "vehicles"),
        where("userId", "==", loueurId)
      );

      const vehiclesSnapshot = await getDocs(vehiclesQuery);
      const vehiclesData = vehiclesSnapshot.docs.map((vehicleDoc) => ({
        id: vehicleDoc.id,
        ...vehicleDoc.data(),
      })) as Vehicle[];

      setVehicles(vehiclesData);
      setFilteredVehicles(vehiclesData);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkVehiclesAvailability = async () => {
    if (!dateDebutFilter || !dateFinFilter) return;

    const startDate = new Date(dateDebutFilter);
    const endDate = new Date(dateFinFilter);

    if (endDate < startDate) {
      setDateError("La date de fin doit être après la date de début");
      setUnavailableVehicleIds(new Set());
      return;
    }

    setDateError("");

    try {
      const reservationsRef = collection(db, "reservations");
      const q = query(
        reservationsRef,
        where("loueurId", "==", loueurId),
        where("status", "in", ["en_attente", "confirmee"])
      );

      const snapshot = await getDocs(q);
      const unavailableIds = new Set<string>();

      snapshot.forEach((docSnap) => {
        const reservation = docSnap.data() as any;
        if (!reservation.dateDebut || !reservation.dateFin) return;

        const existingStart = reservation.dateDebut.toDate();
        const existingEnd = reservation.dateFin.toDate();

        // chevauchement
        if (existingStart <= endDate && existingEnd >= startDate) {
          if (reservation.vehicleId) {
            unavailableIds.add(reservation.vehicleId as string);
          }
        }
      });

      setUnavailableVehicleIds(unavailableIds);
    } catch (error) {
      console.error("Erreur vérification disponibilité:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...vehicles];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((v) => {
        const marque = (v.marque || "").toLowerCase();
        const modele = (v.modele || "").toLowerCase();
        return marque.includes(term) || modele.includes(term);
      });
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((v) => v.type === selectedType);
    }

    if (priceRange !== "all") {
      const parts = priceRange.split("-");
      const min = parseInt(parts[0] || "0", 10);
      const max = parts[1] ? parseInt(parts[1], 10) : 999999;
      filtered = filtered.filter((v) => {
        const prix = typeof v.prix === "number" ? v.prix : 0;
        return prix >= min && prix <= max;
      });
    }

    if (dateDebutFilter && dateFinFilter && !dateError) {
      filtered = filtered.filter((v) => !unavailableVehicleIds.has(v.id));
    }

    setFilteredVehicles(filtered);
  };

  const handleVehicleClick = (vehicleId: string) => {
    router.push(`/loueur/${loueurId}/vehicule/${vehicleId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!loueur) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">Loueur non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Carte loueur */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-shrink-0">
            {loueur.photoURL ? (
              <img
                src={loueur.photoURL}
                alt="Photo du loueur"
                className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-200">
                <span className="text-3xl text-green-600">L</span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {loueur.displayName || "Loueur"}
            </h1>

            {loueur.ville && (
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <MapPin className="w-4 h-4" />
                <span>{loueur.ville}</span>
              </div>
            )}

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">4.8</span>
                <span className="text-sm text-gray-500">(125 avis)</span>
              </div>
              <div className="text-sm text-gray-600">
                {vehicles.length} véhicule{vehicles.length > 1 ? "s" : ""}
              </div>
            </div>

            {loueur.telephone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{loueur.telephone}</span>
              </div>
            )}
          </div>

          {loueur.telephone && (
            <a
              href={`https://wa.me/${loueur.telephone.replace(/\s/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              💬 Contacter
            </a>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Filtres</h2>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">
            Choisissez vos dates pour voir les véhicules disponibles
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de début
              </label>
              <input
                type="date"
                value={dateDebutFilter}
                onChange={(e) => setDateDebutFilter(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de fin
              </label>
              <input
                type="date"
                value={dateFinFilter}
                onChange={(e) => setDateFinFilter(e.target.value)}
                min={dateDebutFilter || new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          {dateError && (
            <p className="text-sm text-red-600 mt-2">{dateError}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Tous les types</option>
            <option value="berline">Berline</option>
            <option value="suv">SUV</option>
            <option value="citadine">Citadine</option>
            <option value="4x4">4x4</option>
            <option value="utilitaire">Utilitaire</option>
          </select>

          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Tous les prix</option>
            <option value="0-200">0 - 200 MAD</option>
            <option value="200-400">200 - 400 MAD</option>
            <option value="400-600">400 - 600 MAD</option>
            <option value="600-999999">600+ MAD</option>
          </select>
        </div>
      </div>

      {/* Liste véhicules */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">🚗</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Aucun véhicule disponible
          </h2>
          <p className="text-gray-600">
            {dateDebutFilter && dateFinFilter
              ? "Aucun véhicule disponible pour ces dates. Essayez d'autres dates."
              : "Modifiez vos filtres pour voir les véhicules."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              onClick={() => handleVehicleClick(vehicle.id)}
              className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="relative h-48 bg-gray-200">
                {vehicle.photos && vehicle.photos.length > 0 ? (
                  <img
                    src={vehicle.photos[0]}
                    alt="Photo du véhicule"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">🚗</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 px-3 py-1 bg-white rounded-full text-sm font-medium">
                  {vehicle.type}
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {vehicle.marque} {vehicle.modele}
                </h3>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>{vehicle.transmission}</span>
                  <span>{vehicle.carburant}</span>
                  <span>{vehicle.places} places</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-green-600">
                      {vehicle.prix}
                    </span>
                    <span className="text-gray-600 ml-1">MAD/j</span>
                  </div>
                  <div className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">
                    Réserver
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
