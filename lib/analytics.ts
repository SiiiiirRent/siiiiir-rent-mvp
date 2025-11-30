import { Reservation, Vehicle } from "./types";
import {
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  differenceInDays,
  format,
  subMonths,
} from "date-fns";

// ===== TYPES =====

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  reservations: number;
}

export interface VehicleStats {
  vehicleId: string;
  vehicleName: string;
  totalReservations: number;
  totalRevenue: number;
  totalDays: number;
  occupancyRate: number;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalReservations: number;
  averageRevenue: number;
  occupancyRate: number;
  monthlyRevenues: MonthlyRevenue[];
  topVehiclesByRevenue: VehicleStats[];
  topVehiclesByReservations: VehicleStats[];
  recentReservations: Reservation[];
}

// ===== FONCTIONS =====

export function calculateReservationRevenue(reservation: Reservation): number {
  // Si le paiement n'est pas confirmé, on compte 0
  if (reservation.paymentStatus !== "paye") {
    return 0;
  }
  return reservation.prixTotal || 0;
}

export function calculateReservationDays(reservation: Reservation): number {
  return reservation.nbJours || 1;
}

export function getMonthReservations(
  reservations: Reservation[],
  month: Date = new Date()
): Reservation[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  return reservations.filter((reservation) => {
    const resStart = reservation.dateDebut?.toDate
      ? reservation.dateDebut.toDate()
      : new Date(reservation.dateDebut);
    const resEnd = reservation.dateFin?.toDate
      ? reservation.dateFin.toDate()
      : new Date(reservation.dateFin);

    return (
      isWithinInterval(resStart, { start, end }) ||
      isWithinInterval(resEnd, { start, end }) ||
      (resStart < start && resEnd > end)
    );
  });
}

export function calculateTotalRevenue(reservations: Reservation[]): number {
  return reservations.reduce(
    (total, reservation) => total + calculateReservationRevenue(reservation),
    0
  );
}

export function calculateOccupancyRate(
  reservations: Reservation[],
  vehicles: Vehicle[],
  month: Date = new Date()
): number {
  if (vehicles.length === 0) return 0;

  const monthReservations = getMonthReservations(reservations, month);
  const daysInMonth =
    differenceInDays(endOfMonth(month), startOfMonth(month)) + 1;

  const totalAvailableDays = vehicles.length * daysInMonth;

  const totalRentedDays = monthReservations.reduce((total, reservation) => {
    return total + calculateReservationDays(reservation);
  }, 0);

  return (totalRentedDays / totalAvailableDays) * 100;
}

export function calculateMonthlyRevenues(
  reservations: Reservation[],
  monthsCount: number = 6
): MonthlyRevenue[] {
  const monthlyData: MonthlyRevenue[] = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const month = subMonths(new Date(), i);
    const monthReservations = getMonthReservations(reservations, month);

    monthlyData.push({
      month: format(month, "MMM yyyy"),
      revenue: calculateTotalRevenue(monthReservations),
      reservations: monthReservations.length,
    });
  }

  return monthlyData;
}

export function calculateVehicleStats(
  reservations: Reservation[],
  vehicles: Vehicle[]
): VehicleStats[] {
  const vehicleStatsMap = new Map<string, VehicleStats>();

  vehicles.forEach((vehicle) => {
    vehicleStatsMap.set(vehicle.id, {
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.marque} ${vehicle.modele}`,
      totalReservations: 0,
      totalRevenue: 0,
      totalDays: 0,
      occupancyRate: 0,
    });
  });

  reservations.forEach((reservation) => {
    const stats = vehicleStatsMap.get(reservation.vehicleId);
    if (stats) {
      stats.totalReservations++;
      stats.totalRevenue += calculateReservationRevenue(reservation);
      stats.totalDays += calculateReservationDays(reservation);
    }
  });

  const now = new Date();
  const daysInMonth = differenceInDays(endOfMonth(now), startOfMonth(now)) + 1;

  vehicleStatsMap.forEach((stats) => {
    stats.occupancyRate = (stats.totalDays / daysInMonth) * 100;
  });

  return Array.from(vehicleStatsMap.values());
}

export function getTopVehiclesByRevenue(
  vehicleStats: VehicleStats[],
  limit: number = 5
): VehicleStats[] {
  return [...vehicleStats]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);
}

export function getTopVehiclesByReservations(
  vehicleStats: VehicleStats[],
  limit: number = 5
): VehicleStats[] {
  return [...vehicleStats]
    .sort((a, b) => b.totalReservations - a.totalReservations)
    .slice(0, limit);
}

export function getRecentReservations(
  reservations: Reservation[],
  limit: number = 10
): Reservation[] {
  return [...reservations]
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

export function calculateAnalytics(
  reservations: Reservation[],
  vehicles: Vehicle[]
): AnalyticsData {
  const currentMonthReservations = getMonthReservations(reservations);
  const totalRevenue = calculateTotalRevenue(currentMonthReservations);
  const totalReservations = currentMonthReservations.length;
  const averageRevenue =
    totalReservations > 0 ? totalRevenue / totalReservations : 0;
  const occupancyRate = calculateOccupancyRate(reservations, vehicles);

  const vehicleStats = calculateVehicleStats(reservations, vehicles);

  return {
    totalRevenue,
    totalReservations,
    averageRevenue,
    occupancyRate,
    monthlyRevenues: calculateMonthlyRevenues(reservations),
    topVehiclesByRevenue: getTopVehiclesByRevenue(vehicleStats),
    topVehiclesByReservations: getTopVehiclesByReservations(vehicleStats),
    recentReservations: getRecentReservations(reservations),
  };
}

export function exportToCSV(reservations: Reservation[]): string {
  const headers = [
    "ID",
    "Client",
    "Véhicule",
    "Date Début",
    "Date Fin",
    "Durée (jours)",
    "Montant Total",
    "Statut Paiement",
    "Statut",
  ];

  const rows = reservations.map((reservation) => {
    const dateDebut = reservation.dateDebut?.toDate
      ? reservation.dateDebut.toDate()
      : new Date(reservation.dateDebut);
    const dateFin = reservation.dateFin?.toDate
      ? reservation.dateFin.toDate()
      : new Date(reservation.dateFin);

    return [
      reservation.id,
      reservation.locataireNom,
      `${reservation.vehicleMarque} ${reservation.vehicleModele}`,
      format(dateDebut, "dd/MM/yyyy"),
      format(dateFin, "dd/MM/yyyy"),
      reservation.nbJours,
      reservation.prixTotal || 0,
      reservation.paymentStatus === "paye" ? "Payé" : "Non payé",
      reservation.status,
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}
