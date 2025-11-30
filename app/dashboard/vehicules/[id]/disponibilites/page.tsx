"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle, BlockedDate } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from "lucide-react";
import {
  getBlockedDatesForVehicle,
  getReservedDatesForVehicle,
  dateToMidnight,
} from "@/lib/availability";

export default function DisponibilitesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const vehicleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [reservedDates, setReservedDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState<"maintenance" | "manual" | "other">(
    "manual"
  );
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [vehicleId, currentMonth]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger le véhicule
      const vehicleDoc = await getDoc(doc(db, "vehicles", vehicleId));
      if (vehicleDoc.exists()) {
        setVehicle({ id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle);
      }

      // Charger les dates bloquées
      const blocked = await getBlockedDatesForVehicle(vehicleId);
      setBlockedDates(blocked);

      // Charger les réservations
      const reservedRanges = await getReservedDatesForVehicle(vehicleId);
      const allReservedDates: Date[] = [];

      for (const range of reservedRanges) {
        const current = new Date(range.dateDebut);
        const end = new Date(range.dateFin);

        while (current <= end) {
          allReservedDates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      }

      setReservedDates(allReservedDates);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    // Vérifier si la date est dans le passé
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return;

    // Vérifier si la date est réservée
    const isReserved = reservedDates.some((d) => {
      const reservedDate = new Date(d);
      reservedDate.setHours(0, 0, 0, 0);
      return reservedDate.getTime() === date.getTime();
    });

    if (isReserved) {
      alert("Cette date est déjà réservée et ne peut pas être bloquée.");
      return;
    }

    // Vérifier si la date est déjà bloquée
    const existingBlock = blockedDates.find((b) => {
      const blockedDate = b.date.toDate();
      blockedDate.setHours(0, 0, 0, 0);
      return blockedDate.getTime() === date.getTime();
    });

    if (existingBlock) {
      // Débloquer
      handleUnblock(existingBlock.id);
    } else {
      // Bloquer
      setSelectedDate(date);
      setShowModal(true);
    }
  };

  const handleBlock = async () => {
    if (!selectedDate || !user) return;

    setProcessing(true);

    try {
      await addDoc(collection(db, "blocked_dates"), {
        vehicleId: vehicleId,
        date: dateToMidnight(selectedDate),
        reason: reason,
        notes: notes || null,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
      });

      setShowModal(false);
      setSelectedDate(null);
      setReason("manual");
      setNotes("");
      await loadData();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du blocage de la date");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnblock = async (blockId: string) => {
    if (!confirm("Débloquer cette date ?")) return;

    try {
      await deleteDoc(doc(db, "blocked_dates", blockId));
      await loadData();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du déblocage");
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const isDateBlocked = (date: Date) => {
    return blockedDates.some((b) => {
      const blockedDate = b.date.toDate();
      blockedDate.setHours(0, 0, 0, 0);
      return blockedDate.getTime() === date.getTime();
    });
  };

  const isDateReserved = (date: Date) => {
    return reservedDates.some((d) => {
      const reservedDate = new Date(d);
      reservedDate.setHours(0, 0, 0, 0);
      return reservedDate.getTime() === date.getTime();
    });
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Véhicule non trouvé</p>
      </div>
    );
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Disponibilités - {vehicle.marque} {vehicle.modele}
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez les disponibilités de votre véhicule
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Légende */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Légende</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 border-2 border-blue-400 rounded"></div>
              <span className="text-sm text-gray-600">Réservé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 border-2 border-red-400 rounded"></div>
              <span className="text-sm text-gray-600">Bloqué</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">Passé</span>
            </div>
          </div>
        </div>

        {/* Calendrier */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {/* Navigation mois */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 capitalize">
              {monthName}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Grille calendrier */}
          <div className="grid grid-cols-7 gap-2">
            {/* Jours de la semaine */}
            {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-gray-600 py-2"
              >
                {day}
              </div>
            ))}

            {/* Cases vides avant le 1er du mois */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}

            {/* Jours du mois */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                day
              );
              date.setHours(0, 0, 0, 0);

              const blocked = isDateBlocked(date);
              const reserved = isDateReserved(date);
              const past = isPastDate(date);

              let bgColor = "bg-white hover:bg-gray-50";
              let borderColor = "border-gray-300";
              let textColor = "text-gray-900";
              let cursor = "cursor-pointer";

              if (past) {
                bgColor = "bg-gray-100";
                borderColor = "border-gray-300";
                textColor = "text-gray-400";
                cursor = "cursor-not-allowed";
              } else if (reserved) {
                bgColor = "bg-blue-100";
                borderColor = "border-blue-400";
                textColor = "text-blue-900";
                cursor = "cursor-not-allowed";
              } else if (blocked) {
                bgColor = "bg-red-100 hover:bg-red-200";
                borderColor = "border-red-400";
                textColor = "text-red-900";
              }

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(date)}
                  disabled={past}
                  className={`aspect-square border-2 rounded-lg flex items-center justify-center font-medium transition-colors ${bgColor} ${borderColor} ${textColor} ${cursor}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2 text-blue-800">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">Comment ça marche ?</p>
                <p>
                  Cliquez sur une date disponible (blanche) pour la bloquer.
                  Cliquez sur une date bloquée (rouge) pour la débloquer. Les
                  dates réservées (bleues) ne peuvent pas être modifiées.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de blocage */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Bloquer une date
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Date sélectionnée</p>
              <p className="font-semibold text-gray-900">
                {selectedDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du blocage
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="manual">Blocage manuel</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Révision annuelle, réparation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleBlock}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Blocage...</span>
                  </>
                ) : (
                  "Bloquer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
