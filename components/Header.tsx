// components/Header.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, userRole, loading, logout } = useAuth(); // ✅ Ajouter loading et userRole

  return (
    <header className="w-full border-b bg-white/70 backdrop-blur">
      <div className="mx-auto w-[min(1100px,92%)] h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-wide">
          SIIIIIR RENT
        </Link>

        {/* ✅ Afficher un loader pendant le chargement */}
        {loading ? (
          <div className="w-32 h-9 bg-gray-200 animate-pulse rounded"></div>
        ) : user ? (
          <nav className="flex items-center gap-3">
            {/* ✅ Afficher le rôle */}
            <span className="text-sm text-gray-600">
              {userRole === "locataire" ? "Locataire" : "Loueur"}
            </span>
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded border hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <button
              onClick={logout}
              className="px-3 py-2 rounded bg-black text-white hover:bg-gray-800"
            >
              Se déconnecter
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3 py-2 rounded bg-black text-white hover:bg-gray-800"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="px-3 py-2 rounded border hover:bg-gray-50"
            >
              Créer un compte
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
