/**
 * Page "Calendrier" - Vue calendrier des réservations
 * Affiche toutes les réservations du loueur dans un calendrier mensuel
 * avec codes couleur selon le statut
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Reservation } from "@/lib/types";

export default function CalendrierPage() {
  const { user } = useAuth();

  // États
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayReservations, setSelectedDayReservations] = useState<
    Reservation[]
  >([]);

  // Charger les réservations au montage
  useEffect(() => {
    if (user) {
      loadReservations();
    }
  }, [user]);

  /**
   * Charge toutes les réservations du loueur
   */
  const loadReservations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const q = query(
        collection(db, "reservations"),
        where("loueurId", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
      const reservationsData: Reservation[] = [];

      querySnapshot.forEach((doc) => {
        reservationsData.push({ id: doc.id, ...doc.data() } as Reservation);
      });

      setReservations(reservationsData);
    } catch (error) {
      console.error("Erreur chargement réservations:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtenir le nombre de jours dans un mois
   */
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  /**
   * Obtenir le premier jour du mois (0 = dimanche, 1 = lundi, etc.)
   */
  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  /**
   * Vérifier si une date a des réservations
   */
  const getReservationsForDate = (date: Date): Reservation[] => {
    return reservations.filter((reservation) => {
      const startDate = reservation.dateDebut?.toDate();
      const endDate = reservation.dateFin?.toDate();

      if (!startDate || !endDate) return false;

      // Normaliser les dates pour comparer seulement jour/mois/année
      const normalizedDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const normalizedStart = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );
      const normalizedEnd = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );

      return (
        normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd
      );
    });
  };

  /**
   * Obtenir la couleur de la pastille selon le statut
   */
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      en_attente: "bg-yellow-500",
      confirmee: "bg-green-500",
      en_cours: "bg-blue-500",
      terminee: "bg-gray-400",
      annulee: "bg-red-500",
    };
    return colors[status] || "bg-gray-400";
  };

  /**
   * Générer les jours du calendrier
   */
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: (number | null)[] = [];

    // Ajouter les jours vides avant le premier jour du mois
    // En France, la semaine commence le lundi (1), pas le dimanche (0)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }

    // Ajouter tous les jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  /**
   * Naviguer au mois précédent
   */
  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  /**
   * Naviguer au mois suivant
   */
  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  /**
   * Revenir au mois actuel
   */
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  /**
   * Gérer le clic sur une date
   */
  const handleDateClick = (day: number) => {
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(clickedDate);
    const dayReservations = getReservationsForDate(clickedDate);
    setSelectedDayReservations(dayReservations);
  };

  /**
   * Formater une date
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  /**
   * Vérifier si c'est aujourd'hui
   */
  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Calendrier
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Vue d'ensemble de vos réservations
        </p>
      </div>

      {/* Navigation du calendrier */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            ← Mois précédent
          </button>

          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={goToToday}
              className="text-sm text-green-600 hover:text-green-700 mt-1"
            >
              Aujourd'hui
            </button>
          </div>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            Mois suivant →
          </button>
        </div>

        {/* Légende */}
        <div className="flex flex-wrap gap-4 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">En attente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Confirmée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Terminée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Annulée</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendrier */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4">
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs md:text-sm font-semibold text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Jours du mois */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const date = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day
              );
              const dayReservations = getReservationsForDate(date);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square p-1 md:p-2 rounded-lg border transition hover:bg-gray-50 ${
                    today ? "border-green-500 bg-green-50" : "border-gray-200"
                  } ${
                    selectedDate &&
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentDate.getMonth()
                      ? "ring-2 ring-green-500"
                      : ""
                  }`}
                >
                  <div className="text-sm md:text-base font-medium text-gray-900">
                    {day}
                  </div>

                  {/* Pastilles de réservations */}
                  {dayReservations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 justify-center">
                      {dayReservations.slice(0, 3).map((reservation) => (
                        <div
                          key={reservation.id}
                          className={`w-2 h-2 rounded-full ${getStatusColor(
                            reservation.status
                          )}`}
                        />
                      ))}
                      {dayReservations.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayReservations.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Détails du jour sélectionné */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          {selectedDate ? (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {formatDate(selectedDate)}
              </h3>

              {selectedDayReservations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-gray-600 text-sm">
                    Aucune réservation ce jour
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(
                            reservation.status
                          )}`}
                        />
                        <h4 className="font-semibold text-sm text-gray-900">
                          {reservation.vehicleMarque}{" "}
                          {reservation.vehicleModele}
                        </h4>
                      </div>

                      <p className="text-xs text-gray-600 mb-1">
                        👤 {reservation.locataireNom}
                      </p>

                      <p className="text-xs text-gray-600 mb-1">
                        📧 {reservation.locataireEmail}
                      </p>

                      <p className="text-xs text-gray-600 mb-2">
                        📅 {reservation.nbJours} jour
                        {reservation.nbJours > 1 ? "s" : ""}
                      </p>

                      <p className="text-sm font-bold text-green-600">
                        {reservation.prixTotal} MAD
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">👆</div>
              <p className="text-gray-600 text-sm">
                Cliquez sur une date pour voir les réservations
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Message si aucune réservation */}
      {reservations.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center mt-6">
          <div className="text-4xl md:text-6xl mb-4">📅</div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
            Aucune réservation
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Vos réservations apparaîtront dans le calendrier dès que des
            locataires réserveront vos véhicules.
          </p>
        </div>
      )}
    </div>
  );
}
