import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { BlockedDate } from "./types";

/**
 * Convertit une date en timestamp de minuit (00:00:00)
 */
export function dateToMidnight(date: Date): Timestamp {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(midnight);
}

/**
 * Génère un tableau de toutes les dates entre dateDebut et dateFin (inclus)
 */
export function getDatesInRange(dateDebut: Date, dateFin: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(dateDebut);
  current.setHours(0, 0, 0, 0);

  const end = new Date(dateFin);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Récupère toutes les dates bloquées pour un véhicule
 */
export async function getBlockedDatesForVehicle(
  vehicleId: string
): Promise<BlockedDate[]> {
  try {
    const blockedDatesQuery = query(
      collection(db, "blocked_dates"),
      where("vehicleId", "==", vehicleId)
    );

    const snapshot = await getDocs(blockedDatesQuery);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as BlockedDate)
    );
  } catch (error) {
    console.error("Erreur récupération dates bloquées:", error);
    return [];
  }
}

/**
 * Récupère les réservations confirmées pour un véhicule
 */
export async function getReservedDatesForVehicle(
  vehicleId: string
): Promise<{ dateDebut: Date; dateFin: Date }[]> {
  try {
    const reservationsQuery = query(
      collection(db, "reservations"),
      where("vehicleId", "==", vehicleId),
      where("status", "in", ["confirmee", "en_cours"])
    );

    const snapshot = await getDocs(reservationsQuery);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        dateDebut: data.dateDebut.toDate(),
        dateFin: data.dateFin.toDate(),
      };
    });
  } catch (error) {
    console.error("Erreur récupération réservations:", error);
    return [];
  }
}

/**
 * Vérifie si une plage de dates est disponible pour un véhicule
 */
export async function checkAvailability(
  vehicleId: string,
  dateDebut: Date,
  dateFin: Date,
  excludeReservationId?: string
): Promise<{
  available: boolean;
  conflicts: string[];
}> {
  try {
    // Normaliser les dates (minuit)
    const debut = new Date(dateDebut);
    debut.setHours(0, 0, 0, 0);

    const fin = new Date(dateFin);
    fin.setHours(0, 0, 0, 0);

    const conflicts: string[] = [];

    // 1. Vérifier les dates bloquées manuellement
    const blockedDates = await getBlockedDatesForVehicle(vehicleId);
    const requestedDates = getDatesInRange(debut, fin);

    for (const requestedDate of requestedDates) {
      const requestedTimestamp = dateToMidnight(requestedDate);

      const isBlocked = blockedDates.some((blocked) => {
        const blockedDate = blocked.date.toDate();
        blockedDate.setHours(0, 0, 0, 0);
        return blockedDate.getTime() === requestedDate.getTime();
      });

      if (isBlocked) {
        conflicts.push(
          `Date bloquée: ${requestedDate.toLocaleDateString("fr-FR")}`
        );
      }
    }

    // 2. Vérifier les réservations existantes
    let reservationsQuery = query(
      collection(db, "reservations"),
      where("vehicleId", "==", vehicleId),
      where("status", "in", ["confirmee", "en_cours"])
    );

    const reservationsSnapshot = await getDocs(reservationsQuery);

    for (const doc of reservationsSnapshot.docs) {
      // Ignorer la réservation actuelle si on est en mode édition
      if (excludeReservationId && doc.id === excludeReservationId) {
        continue;
      }

      const reservation = doc.data();
      const resDebut = reservation.dateDebut.toDate();
      resDebut.setHours(0, 0, 0, 0);

      const resFin = reservation.dateFin.toDate();
      resFin.setHours(0, 0, 0, 0);

      // Vérifier s'il y a chevauchement
      const hasOverlap = debut <= resFin && fin >= resDebut;

      if (hasOverlap) {
        conflicts.push(
          `Réservation existante du ${resDebut.toLocaleDateString(
            "fr-FR"
          )} au ${resFin.toLocaleDateString("fr-FR")}`
        );
      }
    }

    return {
      available: conflicts.length === 0,
      conflicts,
    };
  } catch (error) {
    console.error("Erreur vérification disponibilité:", error);
    return {
      available: false,
      conflicts: ["Erreur lors de la vérification"],
    };
  }
}

/**
 * Récupère toutes les dates indisponibles pour un véhicule (bloquées + réservées)
 */
export async function getUnavailableDates(vehicleId: string): Promise<Date[]> {
  try {
    const unavailableDates: Date[] = [];

    // 1. Dates bloquées manuellement
    const blockedDates = await getBlockedDatesForVehicle(vehicleId);
    for (const blocked of blockedDates) {
      const date = blocked.date.toDate();
      date.setHours(0, 0, 0, 0);
      unavailableDates.push(date);
    }

    // 2. Dates réservées
    const reservedRanges = await getReservedDatesForVehicle(vehicleId);
    for (const range of reservedRanges) {
      const dates = getDatesInRange(range.dateDebut, range.dateFin);
      unavailableDates.push(...dates);
    }

    return unavailableDates;
  } catch (error) {
    console.error("Erreur récupération dates indisponibles:", error);
    return [];
  }
}
