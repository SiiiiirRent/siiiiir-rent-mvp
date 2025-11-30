import React from "react";
import { VehicleStats } from "@/lib/analytics";

interface TopVehiclesProps {
  vehicles: VehicleStats[];
  type: "revenue" | "reservations";
}

export default function TopVehicles({ vehicles, type }: TopVehiclesProps) {
  const title =
    type === "revenue"
      ? "Véhicules les plus rentables"
      : "Véhicules les plus loués";

  const emptyMessage =
    vehicles.length === 0 ? "Aucune donnée disponible" : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">Top 5 ce mois</p>
      </div>

      {emptyMessage ? (
        <p className="text-gray-500 text-center py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle, index) => (
            <div
              key={vehicle.vehicleId}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {vehicle.vehicleName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {vehicle.totalReservations} réservation
                    {vehicle.totalReservations > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {type === "revenue" ? (
                  <>
                    <p className="font-semibold text-gray-900">
                      {vehicle.totalRevenue.toLocaleString("fr-FR")} MAD
                    </p>
                    <p className="text-xs text-gray-500">
                      {vehicle.totalDays} jours loués
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900">
                      {vehicle.totalReservations} fois
                    </p>
                    <p className="text-xs text-gray-500">
                      {vehicle.occupancyRate.toFixed(1)}% occupation
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
