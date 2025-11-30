"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  Clipboard,
  Download,
  Mail,
  Search,
  Users,
  Filter,
  CheckSquare,
  Square,
} from "lucide-react";

type Role = "loueur" | "locataire";

interface AdminUser {
  id: string;
  email?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  role?: Role | string;
  ville?: string;
  kycStatus?: string; // "pending" | "verified" | ...
  isVerified?: boolean;
}

export default function AdminEmailsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<Role>("loueur");
  const [search, setSearch] = useState("");
  const [filterKyc, setFilterKyc] = useState<"all" | "pending" | "verified">(
    "all"
  );
  const [onlyWithEmail, setOnlyWithEmail] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ----------------- LOAD USERS -----------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "users"));
        const data = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as AdminUser
        );
        setUsers(data);
      } catch (e) {
        console.error("Erreur chargement users:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ----------------- LISTES PAR RÔLE -----------------
  const loueurs = useMemo(
    () => users.filter((u) => u.role === "loueur"),
    [users]
  );
  const locataires = useMemo(
    () => users.filter((u) => u.role === "locataire"),
    [users]
  );

  const baseList = activeTab === "loueur" ? loueurs : locataires;

  // ----------------- FILTRES + SEARCH -----------------
  const filteredList = useMemo(() => {
    return baseList.filter((u) => {
      if (onlyWithEmail && !u.email) return false;

      if (filterKyc === "pending" && u.kycStatus !== "pending") return false;
      if (filterKyc === "verified" && u.kycStatus !== "verified") return false;

      if (!search.trim()) return true;

      const haystack = (
        (u.nom || "") +
        " " +
        (u.prenom || "") +
        " " +
        (u.email || "") +
        " " +
        (u.telephone || "") +
        " " +
        (u.ville || "")
      )
        .toLowerCase()
        .trim();

      return haystack.includes(search.toLowerCase().trim());
    });
  }, [baseList, onlyWithEmail, filterKyc, search]);

  // ----------------- SELECTION -----------------
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const currentIds = filteredList.map((u) => u.id);
    const allSelected = currentIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      // désélectionner ceux de la liste
      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      // ajouter tous ceux de la liste
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const selectedUsers = filteredList.filter((u) => selectedIds.includes(u.id));

  const listForActions =
    selectedUsers.length > 0 ? selectedUsers : filteredList;

  // ----------------- ACTIONS -----------------
  const copyEmails = () => {
    const emails = listForActions
      .map((u) => u.email)
      .filter(Boolean) as string[];
    if (emails.length === 0) {
      alert("Aucun email à copier.");
      return;
    }
    navigator.clipboard.writeText(emails.join(", "));
    alert(`📋 ${emails.length} emails copiés dans le presse-papiers.`);
  };

  const openMailClient = () => {
    const emails = listForActions
      .map((u) => u.email)
      .filter(Boolean) as string[];
    if (emails.length === 0) {
      alert("Aucun email à utiliser.");
      return;
    }
    const bcc = encodeURIComponent(emails.join(","));
    window.location.href = `mailto:?bcc=${bcc}&subject=${encodeURIComponent(
      "SIIIIIR Rent - Nouvelle version"
    )}`;
  };

  const exportCSV = () => {
    if (listForActions.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const rows = listForActions.map((u) => ({
      Nom: (u.prenom ? `${u.prenom} ` : "") + (u.nom || ""),
      Email: u.email || "",
      Téléphone: u.telephone || "",
      Ville: u.ville || "",
      Rôle: u.role || "",
      KYC: u.kycStatus || "",
    }));

    const header = Object.keys(rows[0]).join(",");
    const body = rows.map((r) => Object.values(r).join(",")).join("\n");
    const csvContent = header + "\n" + body;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `emails-${activeTab}.csv`;
    link.click();
  };

  // ----------------- RENDER -----------------
  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-green-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-green-600" />
            Emails Utilisateurs
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez les listes d&apos;emails des loueurs et des locataires pour
            vos campagnes (V2, newsletter, etc.).
          </p>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-semibold">{filteredList.length}</span>{" "}
          utilisateurs affichés
          {selectedUsers.length > 0 && (
            <span className="ml-2 text-green-600">
              ({selectedUsers.length} sélectionné
              {selectedUsers.length > 1 ? "s" : ""})
            </span>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap items-center gap-4 border-b pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("loueur")}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              activeTab === "loueur"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Loueurs ({loueurs.length})
          </button>
          <button
            onClick={() => setActiveTab("locataire")}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              activeTab === "locataire"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Locataires ({locataires.length})
          </button>
        </div>

        {/* SEARCH */}
        <div className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone, ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterKyc}
              onChange={(e) =>
                setFilterKyc(e.target.value as "all" | "pending" | "verified")
              }
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="all">KYC : Tous</option>
              <option value="pending">KYC : En attente</option>
              <option value="verified">KYC : Vérifiés</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={onlyWithEmail}
              onChange={(e) => setOnlyWithEmail(e.target.checked)}
            />
            <span>Seulement avec email</span>
          </label>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={toggleSelectAll}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm"
        >
          {filteredList.length > 0 &&
          filteredList.every((u) => selectedIds.includes(u.id)) ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          {filteredList.length > 0 &&
          filteredList.every((u) => selectedIds.includes(u.id))
            ? "Tout désélectionner"
            : "Tout sélectionner (liste visible)"}
        </button>

        <button
          onClick={copyEmails}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Clipboard className="w-4 h-4" />
          Copier emails{" "}
          {selectedUsers.length > 0 ? "sélectionnés" : "de la liste"}
        </button>

        <button
          onClick={openMailClient}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
        >
          <Mail className="w-4 h-4" />
          Ouvrir client mail (BCC)
        </button>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black text-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV{" "}
          {selectedUsers.length > 0 ? "sélectionnés" : "liste visible"}
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl shadow bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center justify-center"
                >
                  {filteredList.length > 0 &&
                  filteredList.every((u) => selectedIds.includes(u.id)) ? (
                    <CheckSquare className="w-4 h-4 text-green-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold">
                Nom
              </th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold">
                Email
              </th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold">
                Téléphone
              </th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold">
                Ville
              </th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold">
                KYC
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Aucun utilisateur trouvé avec ces filtres.
                </td>
              </tr>
            )}

            {filteredList.map((user) => {
              const fullName =
                (user.prenom ? `${user.prenom} ` : "") + (user.nom || "");
              const isSelected = selectedIds.includes(user.id);

              return (
                <tr
                  key={user.id}
                  className={`border-t hover:bg-gray-50 ${
                    isSelected ? "bg-green-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSelect(user.id)}
                      className="flex items-center justify-center"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">{fullName || "—"}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span>{user.email || "—"}</span>
                  </td>
                  <td className="px-4 py-3">{user.telephone || "—"}</td>
                  <td className="px-4 py-3">{user.ville || "—"}</td>
                  <td className="px-4 py-3">
                    {user.kycStatus === "verified" ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        Vérifié
                      </span>
                    ) : user.kycStatus === "pending" ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                        En attente
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
