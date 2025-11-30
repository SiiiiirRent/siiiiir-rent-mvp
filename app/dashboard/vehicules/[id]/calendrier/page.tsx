"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle, Reservation, BlockedDate } from "@/lib/types";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Configuration du localizer pour react-big-calendar
const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Types pour les événements du calendrier
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "reservation" | "blocked";
  status?: string;
  clientName?: string;
}

export default function VehicleCalendarPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const vehicleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [blockReason, setBlockReason] = useState<string>("");
  const [blockNotes, setBlockNotes] = useState<string>("");

  useEffect(() => {
    if (user && vehicleId) {
      loadData();
    }
  }, [user, vehicleId]);

  async function loadData() {
    try {
      setLoading(true);

      // Charger le véhicule
      const vehicleDoc = await getDoc(doc(db, "vehicles", vehicleId));
      if (!vehicleDoc.exists()) {
        alert("Véhicule non trouvé");
        router.push("/dashboard/vehicules");
        return;
      }

      const vehicleData = {
        id: vehicleDoc.id,
        ...vehicleDoc.data(),
      } as Vehicle;

      // Vérifier que c'est bien le véhicule du loueur
      if (vehicleData.userId !== user!.uid) {
        alert("Accès non autorisé");
        router.push("/dashboard/vehicules");
        return;
      }

      setVehicle(vehicleData);

      // Charger les réservations
      const reservationsQuery = query(
        collection(db, "reservations"),
        where("vehicleId", "==", vehicleId),
        where("loueurId", "==", user!.uid)
      );
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservations: Reservation[] = reservationsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Reservation)
      );

      // Charger les dates bloquées
      const blockedQuery = query(
        collection(db, "blockedDates"),
        where("vehicleId", "==", vehicleId)
      );
      const blockedSnapshot = await getDocs(blockedQuery);
      const blockedDates: BlockedDate[] = blockedSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as BlockedDate)
      );

      // Convertir en événements calendrier
      const calendarEvents: CalendarEvent[] = [];

      // Réservations
      reservations.forEach((reservation) => {
        const start = reservation.dateDebut?.toDate
          ? reservation.dateDebut.toDate()
          : new Date(reservation.dateDebut);
        const end = reservation.dateFin?.toDate
          ? reservation.dateFin.toDate()
          : new Date(reservation.dateFin);

        calendarEvents.push({
          id: reservation.id,
          title: `${reservation.locataireNom}`,
          start,
          end,
          type: "reservation",
          status: reservation.status,
          clientName: reservation.locataireNom,
        });
      });

      // Dates bloquées
      blockedDates.forEach((blocked) => {
        const date = blocked.date.toDate();
        calendarEvents.push({
          id: blocked.id,
          title: `Bloqué: ${blocked.reason}`,
          start: date,
          end: date,
          type: "blocked",
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Erreur chargement calendrier:", error);
      alert("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectSlot(slotInfo: any) {
    setSelectedDates({
      start: slotInfo.start,
      end: slotInfo.end,
    });
    setShowBlockModal(true);
  }

  async function handleBlockDates() {
    if (!selectedDates.start || !blockReason) {
      alert("Veuillez sélectionner une date et une raison");
      return;
    }

    try {
      const startDate = selectedDates.start;
      const endDate = selectedDates.end || selectedDates.start;

      // Créer des dates bloquées pour chaque jour de la période
      const promises = [];
      let currentDate = startDate;

      while (currentDate <= endDate) {
        promises.push(
          addDoc(collection(db, "blockedDates"), {
            vehicleId,
            date: Timestamp.fromDate(currentDate),
            reason: blockReason,
            notes: blockNotes,
            createdBy: user!.uid,
            createdAt: Timestamp.now(),
          })
        );
        currentDate = addDays(currentDate, 1);
      }

      await Promise.all(promises);

      alert("Dates bloquées avec succès !");
      setShowBlockModal(false);
      setSelectedDates({ start: null, end: null });
      setBlockReason("");
      setBlockNotes("");
      loadData();
    } catch (error) {
      console.error("Erreur blocage dates:", error);
      alert("Erreur lors du blocage des dates");
    }
  }

  async function handleDeleteEvent(event: CalendarEvent) {
    if (event.type === "reservation") {
      alert("Supprimez la réservation depuis la page des réservations");
      return;
    }

    if (!confirm("Débloquer cette date ?")) return;

    try {
      await deleteDoc(doc(db, "blockedDates", event.id));
      alert("Date débloquée !");
      loadData();
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression");
    }
  }

  function eventStyleGetter(event: CalendarEvent) {
    let backgroundColor = "#3b82f6"; // bleu par défaut

    if (event.type === "blocked") {
      backgroundColor = "#ef4444"; // rouge
    } else if (event.type === "reservation") {
      if (event.status === "confirmee") {
        backgroundColor = "#22c55e"; // vert
      } else if (event.status === "en_cours") {
        backgroundColor = "#f59e0b"; // orange
      } else if (event.status === "terminee") {
        backgroundColor = "#6b7280"; // gris
      }
    }

    return {
      style: {
        backgroundColor,
        color: "white",
        borderRadius: "4px",
        border: "none",
        fontSize: "12px",
      },
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Véhicule non trouvé</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/mes-vehicules")}
          className="text-green-600 hover:text-green-700 mb-4 flex items-center gap-2"
        >
          ← Retour aux véhicules
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Calendrier : {vehicle.marque} {vehicle.modele}
        </h1>
        <p className="text-gray-600 mt-1">
          Gérez les réservations et les indisponibilités
        </p>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Réservation confirmée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-700">Réservation en cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span className="text-sm text-gray-700">Réservation terminée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Date bloquée</span>
          </div>
        </div>
      </div>

      {/* Calendrier */}
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        style={{ height: "700px" }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          culture="fr"
          messages={{
            next: "Suivant",
            previous: "Précédent",
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            agenda: "Agenda",
            date: "Date",
            time: "Heure",
            event: "Événement",
            noEventsInRange: "Aucun événement dans cette période",
          }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleDeleteEvent}
          eventPropGetter={eventStyleGetter}
        />
      </div>

      {/* Modal de blocage */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Bloquer des dates
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Période sélectionnée
                </label>
                <p className="text-sm text-gray-600">
                  {selectedDates.start
                    ? format(selectedDates.start, "dd/MM/yyyy", { locale: fr })
                    : ""}{" "}
                  {selectedDates.end &&
                  selectedDates.end.getTime() !== selectedDates.start?.getTime()
                    ? `- ${format(selectedDates.end, "dd/MM/yyyy", {
                        locale: fr,
                      })}`
                    : ""}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison *
                </label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionner une raison</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="manual">Indisponibilité manuelle</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Détails supplémentaires..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setSelectedDates({ start: null, end: null });
                  setBlockReason("");
                  setBlockNotes("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleBlockDates}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Bloquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
