"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const items = [
  { href: "/dashboard", label: "Vue d'ensemble" },
  { href: "/dashboard/mes-vehicules", label: "Mes véhicules" },
  { href: "/dashboard/reservations", label: "Mes réservations" },
  { href: "/dashboard/calendrier", label: "Calendrier" },
  { href: "/dashboard/revenus", label: "Revenus" },
  {
    href: "/espace-loueur/settings/contrat",
    label: "⚙️ Paramètres du contrat",
  },
  { href: "/dashboard/profil", label: "Profil" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    if (onMobileClose) onMobileClose();
    await logout();
    router.push("/");
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 w-64 bg-white border-r z-50
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col
          h-screen lg:h-screen
        `}
      >
        {/* Header avec logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0">
          <span className="text-lg font-semibold tracking-tight">
            SIIIIIR <span className="text-green-600">RENT</span>
          </span>
          {/* Bouton fermer sur mobile */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - prend tout l'espace disponible */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={
                  "block rounded-lg px-3 py-2 text-sm transition-colors " +
                  (active
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-slate-700 hover:bg-slate-50")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ✅ Bouton Se déconnecter en bas - TOUJOURS VISIBLE */}
        <div className="p-3 border-t flex-shrink-0 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>
    </>
  );
}
