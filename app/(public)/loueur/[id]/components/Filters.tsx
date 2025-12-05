"use client";

import { Search, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fr } from "date-fns/locale";

interface PublicFilters {
  dateDebut: Date | null;
  dateFin: Date | null;
  startTime: string;
  endTime: string;
  searchTerm: string;
  selectedType: string;
  priceRange: string;
}

interface FiltersProps {
  filters: PublicFilters;
  onFiltersChange: (filters: PublicFilters) => void;
  blockedDates: Date[];
  dateError: string;
  resultCount: number;
}

export default function Filters({
  filters,
  onFiltersChange,
  blockedDates,
  dateError,
  resultCount,
}: FiltersProps) {
  const updateFilter = (key: keyof PublicFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const isDateBlocked = (date: Date): boolean => {
    return blockedDates.some(
      (blockedDate) => blockedDate.toDateString() === date.toDateString()
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Filtres</h2>

      {/* Dates */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-3">
          Choisissez vos dates pour voir les véhicules disponibles
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date de début *
            </label>
            <DatePicker
              selected={filters.dateDebut}
              onChange={(date) => updateFilter("dateDebut", date)}
              minDate={new Date()}
              excludeDates={blockedDates}
              locale={fr}
              dateFormat="dd/MM/yyyy"
              placeholderText="Sélectionnez une date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              dayClassName={(date: Date) =>
                isDateBlocked(date) ? "react-datepicker__day--disabled" : ""
              }
            />
          </div>

          {/* Date fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date de fin *
            </label>
            <DatePicker
              selected={filters.dateFin}
              onChange={(date) => updateFilter("dateFin", date)}
              minDate={filters.dateDebut || new Date()}
              excludeDates={blockedDates}
              locale={fr}
              dateFormat="dd/MM/yyyy"
              placeholderText="Sélectionnez une date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              dayClassName={(date: Date) =>
                isDateBlocked(date) ? "react-datepicker__day--disabled" : ""
              }
            />
          </div>
        </div>

        {dateError && <p className="text-sm text-red-600 mt-2">{dateError}</p>}
      </div>

      {/* Heures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Heure de début
          </label>
          <input
            type="time"
            value={filters.startTime}
            onChange={(e) => updateFilter("startTime", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Heure de fin
          </label>
          <input
            type="time"
            value={filters.endTime}
            onChange={(e) => updateFilter("endTime", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Recherche, Type, Prix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter("searchTerm", e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Type véhicule */}
        <select
          value={filters.selectedType}
          onChange={(e) => updateFilter("selectedType", e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="all">Tous les types</option>
          <option value="berline">Berline</option>
          <option value="suv">SUV</option>
          <option value="citadine">Citadine</option>
          <option value="4x4">4x4</option>
          <option value="utilitaire">Utilitaire</option>
        </select>

        {/* Prix */}
        <select
          value={filters.priceRange}
          onChange={(e) => updateFilter("priceRange", e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="all">Tous les prix</option>
          <option value="0-200">0 - 200 MAD</option>
          <option value="200-400">200 - 400 MAD</option>
          <option value="400-600">400 - 600 MAD</option>
          <option value="600-999999">600+ MAD</option>
        </select>
      </div>

      {/* Nombre de résultats */}
      {filters.dateDebut && filters.dateFin && !dateError && (
        <div className="mt-4 text-sm text-gray-600">
          {resultCount} véhicule{resultCount > 1 ? "s" : ""} disponible
          {resultCount > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
