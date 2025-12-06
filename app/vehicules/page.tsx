("use client");
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import {
  MapPin,
  Users,
  Fuel,
  Settings,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

export default function VehiculesPage() {
  const searchParams = useSearchParams();
  const villeParam = searchParams.get("ville");
  const typeParam = searchParams.get("type");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    ville: villeParam || "",
    type: typeParam || "",
    transmission: "",
    prixMin: "",
    prixMax: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    try {
      setLoading(true);
      const vehiclesRef = collection(db, "vehicles");
      const snapshot = await getDocs(vehiclesRef);
      const vehiclesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Vehicle[];

      // Filtrer uniquement les véhicules disponibles
      const availableVehicles = vehiclesData.filter(
        (v) => v.statut === "disponible"
      );

      setVehicles(availableVehicles);
    } catch (error) {
      console.error("Erreur chargement véhicules:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filtrage des véhicules
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (
      filters.ville &&
      !vehicle.ville.toLowerCase().includes(filters.ville.toLowerCase())
    ) {
      return false;
    }
    if (filters.type && vehicle.type !== filters.type) {
      return false;
    }
    if (filters.transmission && vehicle.transmission !== filters.transmission) {
      return false;
    }
    if (filters.prixMin && vehicle.prix < parseInt(filters.prixMin)) {
      return false;
    }
    if (filters.prixMax && vehicle.prix > parseInt(filters.prixMax)) {
      return false;
    }
    return true;
  });

  const resetFilters = () => {
    setFilters({
      ville: "",
      type: "",
      transmission: "",
      prixMin: "",
      prixMax: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Navbar */}
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Véhicules disponibles
          </h1>
          <p className="text-gray-600">
            {filteredVehicles.length} véhicule
            {filteredVehicles.length > 1 ? "s" : ""} disponible
            {filteredVehicles.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filtres - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900">Filtres</h2>
                <button
                  onClick={resetFilters}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Réinitialiser
                </button>
              </div>

              <div className="space-y-6">
                {/* Ville */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={filters.ville}
                    onChange={(e) =>
                      setFilters({ ...filters, ville: e.target.value })
                    }
                    placeholder="Ex: Casablanca"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de véhicule
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) =>
                      setFilters({ ...filters, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Tous les types</option>
                    <option value="berline">Berline</option>
                    <option value="suv">SUV</option>
                    <option value="citadine">Citadine</option>
                    <option value="utilitaire">Utilitaire</option>
                    <option value="moto">Moto</option>
                    <option value="4x4">4x4</option>
                  </select>
                </div>

                {/* Transmission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transmission
                  </label>
                  <select
                    value={filters.transmission}
                    onChange={(e) =>
                      setFilters({ ...filters, transmission: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Toutes</option>
                    <option value="manuelle">Manuelle</option>
                    <option value="automatique">Automatique</option>
                  </select>
                </div>

                {/* Prix */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix par jour (MAD)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.prixMin}
                      onChange={(e) =>
                        setFilters({ ...filters, prixMin: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.prixMax}
                      onChange={(e) =>
                        setFilters({ ...filters, prixMax: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ✅ NOUVEAU : Panneau de filtres Mobile */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
              <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">Filtres</h2>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Filtres */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Ville */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={filters.ville}
                        onChange={(e) =>
                          setFilters({ ...filters, ville: e.target.value })
                        }
                        placeholder="Ex: Casablanca"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de véhicule
                      </label>
                      <select
                        value={filters.type}
                        onChange={(e) =>
                          setFilters({ ...filters, type: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Tous les types</option>
                        <option value="berline">Berline</option>
                        <option value="suv">SUV</option>
                        <option value="citadine">Citadine</option>
                        <option value="utilitaire">Utilitaire</option>
                        <option value="moto">Moto</option>
                        <option value="4x4">4x4</option>
                      </select>
                    </div>

                    {/* Transmission */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transmission
                      </label>
                      <select
                        value={filters.transmission}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            transmission: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Toutes</option>
                        <option value="manuelle">Manuelle</option>
                        <option value="automatique">Automatique</option>
                      </select>
                    </div>

                    {/* Prix */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix par jour (MAD)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.prixMin}
                          onChange={(e) =>
                            setFilters({ ...filters, prixMin: e.target.value })
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.prixMax}
                          onChange={(e) =>
                            setFilters({ ...filters, prixMax: e.target.value })
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t space-y-2">
                    <button
                      onClick={() => {
                        resetFilters();
                        setShowFilters(false);
                      }}
                      className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Réinitialiser
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      Voir {filteredVehicles.length} véhicule
                      {filteredVehicles.length > 1 ? "s" : ""}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bouton Filtres Mobile */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-lg z-40 hover:bg-green-700 transition-colors"
          >
            <SlidersHorizontal className="w-6 h-6" />
          </button>

          {/* Liste des véhicules */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des véhicules...</p>
                </div>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun véhicule trouvé
                </h3>
                <p className="text-gray-600 mb-6">
                  Essayez de modifier vos critères de recherche
                </p>
                <button
                  onClick={resetFilters}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle) => (
                  <Link
                    key={vehicle.id}
                    href={`/vehicules/${vehicle.id}`}
                    className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gray-200">
                      {vehicle.photos && vehicle.photos.length > 0 ? (
                        <Image
                          src={vehicle.photos[0]}
                          alt={`${vehicle.marque} ${vehicle.modele}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-4xl">
                          🚗
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        {vehicle.marque} {vehicle.modele}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        {vehicle.ville}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {vehicle.places}
                        </div>
                        <div className="flex items-center gap-1">
                          <Settings className="w-4 h-4" />
                          {vehicle.transmission === "automatique"
                            ? "Auto"
                            : "Man"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Fuel className="w-4 h-4" />
                          {vehicle.carburant}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <span className="text-2xl font-bold text-green-600">
                            {vehicle.prix}
                          </span>
                          <span className="text-gray-600 text-sm"> MAD/j</span>
                        </div>
                        <span className="text-green-600 font-medium">
                          Voir détails →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
