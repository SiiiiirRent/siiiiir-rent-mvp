"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle, UserProfile } from "@/lib/types";

interface PublicFilters {
  dateDebut: Date | null;
  dateFin: Date | null;
  startTime: string;
  endTime: string;
  searchTerm: string;
  selectedType: string;
  priceRange: string;
}

interface UsePublicLoueurReturn {
  loueur: UserProfile | null;
  vehicles: Vehicle[];
  filteredVehicles: Vehicle[];
  blockedDates: Date[];
  filters: PublicFilters;
  setFilters: React.Dispatch<React.SetStateAction<PublicFilters>>;
  loading: boolean;
  error: string | null;
  dateError: string;
}

export function usePublicLoueur(loueurId: string): UsePublicLoueurReturn {
  // État
  const [loueur, setLoueur] = useState<UserProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [unavailableVehicleIds, setUnavailableVehicleIds] = useState<
    Set<string>
  >(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState("");

  // Filtres
  const [filters, setFilters] = useState<PublicFilters>({
    dateDebut: null,
    dateFin: null,
    startTime: "",
    endTime: "",
    searchTerm: "",
    selectedType: "all",
    priceRange: "all",
  });

  // Charger les données du loueur
  useEffect(() => {
    async function loadLoueur() {
      try {
        const loueurDoc = await getDoc(doc(db, "users", loueurId));
        if (loueurDoc.exists()) {
          setLoueur({ uid: loueurDoc.id, ...loueurDoc.data() } as UserProfile);
        } else {
          setError("Loueur non trouvé");
        }
      } catch (err) {
        console.error("Erreur chargement loueur:", err);
        setError("Erreur lors du chargement du loueur");
      }
    }

    loadLoueur();
  }, [loueurId]);

  // Charger les véhicules du loueur
  useEffect(() => {
    async function loadVehicles() {
      try {
        const vehiclesQuery = query(
          collection(db, "vehicles"),
          where("userId", "==", loueurId)
        );
        const snapshot = await getDocs(vehiclesQuery);
        const vehiclesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Vehicle[];
        setVehicles(vehiclesData);
      } catch (err) {
        console.error("Erreur chargement véhicules:", err);
        setError("Erreur lors du chargement des véhicules");
      } finally {
        setLoading(false);
      }
    }

    loadVehicles();
  }, [loueurId]);

  // Charger les dates bloquées (réservations existantes)
  useEffect(() => {
    async function loadBlockedDates() {
      try {
        const reservationsQuery = query(
          collection(db, "reservations"),
          where("loueurId", "==", loueurId)
        );
        const snapshot = await getDocs(reservationsQuery);
        const blocked: Date[] = [];

        snapshot.forEach((docSnap) => {
          const reservation = docSnap.data();
          if (!reservation.dateDebut || !reservation.dateFin) return;

          const start = reservation.dateDebut.toDate();
          const end = reservation.dateFin.toDate();

          const current = new Date(start);
          while (current <= end) {
            blocked.push(new Date(current));
            current.setDate(current.getDate() + 1);
          }
        });

        setBlockedDates(blocked);
      } catch (err) {
        console.error("Erreur chargement dates bloquées:", err);
      }
    }

    loadBlockedDates();
  }, [loueurId]);

  // Vérifier disponibilité véhicules selon dates
  useEffect(() => {
    async function checkAvailability() {
      const { dateDebut, dateFin } = filters;

      if (!dateDebut || !dateFin) {
        setUnavailableVehicleIds(new Set());
        setDateError("");
        return;
      }

      const startDate = new Date(dateDebut);
      const endDate = new Date(dateFin);

      if (endDate < startDate) {
        setDateError("La date de fin doit être après la date de début");
        setUnavailableVehicleIds(new Set());
        return;
      }

      setDateError("");

      try {
        const reservationsQuery = query(
          collection(db, "reservations"),
          where("loueurId", "==", loueurId),
          where("status", "in", ["en_attente", "confirmee"])
        );
        const snapshot = await getDocs(reservationsQuery);
        const unavailableIds = new Set<string>();

        snapshot.forEach((docSnap) => {
          const reservation = docSnap.data();
          if (
            !reservation.dateDebut ||
            !reservation.dateFin ||
            !reservation.vehicleId
          )
            return;

          const existingStart = reservation.dateDebut.toDate();
          const existingEnd = reservation.dateFin.toDate();

          // Vérifier chevauchement
          if (existingStart <= endDate && existingEnd >= startDate) {
            unavailableIds.add(reservation.vehicleId);
          }
        });

        setUnavailableVehicleIds(unavailableIds);
      } catch (err) {
        console.error("Erreur vérification disponibilité:", err);
      }
    }

    checkAvailability();
  }, [filters.dateDebut, filters.dateFin, loueurId]);

  // Appliquer tous les filtres (mémoïsé pour performance)
  const filteredVehicles = useMemo(() => {
    let filtered = [...vehicles];

    // Filtre recherche texte
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter((v) => {
        const marque = (v.marque || "").toLowerCase();
        const modele = (v.modele || "").toLowerCase();
        return marque.includes(term) || modele.includes(term);
      });
    }

    // Filtre type véhicule
    if (filters.selectedType !== "all") {
      filtered = filtered.filter((v) => v.type === filters.selectedType);
    }

    // Filtre gamme prix
    if (filters.priceRange !== "all") {
      const [min, maxStr] = filters.priceRange.split("-");
      const max = maxStr ? parseInt(maxStr, 10) : 999999;
      filtered = filtered.filter((v) => {
        const prix = Number(v.prix) || 0;
        return prix >= parseInt(min, 10) && prix <= max;
      });
    }

    // Filtre disponibilité (dates)
    if (filters.dateDebut && filters.dateFin && !dateError) {
      filtered = filtered.filter((v) => !unavailableVehicleIds.has(v.id));
    }

    return filtered;
  }, [vehicles, filters, unavailableVehicleIds, dateError]);

  return {
    loueur,
    vehicles,
    filteredVehicles,
    blockedDates,
    filters,
    setFilters,
    loading,
    error,
    dateError,
  };
}
