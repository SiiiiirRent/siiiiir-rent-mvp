"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, userRole, logout } = useAuth(); // ✅ Ajouter userRole
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b sticky top-0 z-30">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Bouton menu burger (visible uniquement sur mobile) */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo visible sur mobile uniquement */}
          <span className="lg:hidden text-lg font-semibold">
            SIIIIIR <span className="text-green-600">RENT</span>
          </span>

          {/* Titre sur desktop */}
          <h1 className="hidden lg:block text-xl font-semibold text-gray-900">
            Dashboard
          </h1>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.displayName || user?.email}
            </p>
            {/* ✅ AFFICHER LE BON RÔLE */}
            <p className="text-xs text-gray-500">
              {userRole === "locataire" ? "Locataire" : "Loueur"}
            </p>
          </div>

          {/* Avatar */}
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Avatar"
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
              {user?.displayName?.[0] || user?.email?.[0] || "U"}
            </div>
          )}

          {/* Bouton déconnexion */}
          <button
            onClick={handleLogout}
            className="hidden sm:block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
