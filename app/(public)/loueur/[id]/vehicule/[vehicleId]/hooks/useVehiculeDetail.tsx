"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle, UserProfile } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

interface UseVehiculeDetailReturn {
  vehicle: Vehicle | null;
  loueur: UserProfile | null;
  loading: boolean;
  error: string | null;
  currentUser: any;
}

export function useVehiculeDetail(
  loueurId: string,
  vehicleId: string
): UseVehiculeDetailReturn {
  const { user: currentUser } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loueur, setLoueur] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Charger véhicule
        const vehicleDoc = await getDoc(doc(db, "vehicles", vehicleId));
        if (vehicleDoc.exists()) {
          setVehicle({ id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle);
        } else {
          setError("Véhicule non trouvé");
        }

        // Charger loueur
        const loueurDoc = await getDoc(doc(db, "users", loueurId));
        if (loueurDoc.exists()) {
          setLoueur({ uid: loueurDoc.id, ...loueurDoc.data() } as UserProfile);
        } else {
          setError("Loueur non trouvé");
        }
      } catch (err) {
        console.error("Erreur chargement données:", err);
        setError("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [loueurId, vehicleId]);

  return {
    vehicle,
    loueur,
    loading,
    error,
    currentUser,
  };
}
