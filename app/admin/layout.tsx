"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (loading) return;

      if (!user) {
        alert("❌ Vous devez être connecté");
        router.push("/login");
        return;
      }

      try {
        // Vérifier le rôle admin dans Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (!userData || userData.role !== "admin") {
          alert("❌ Accès refusé : Zone réservée aux administrateurs");
          router.push("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Erreur vérification admin:", error);
        router.push("/");
      } finally {
        setChecking(false);
      }
    };

    checkAdminAccess();
  }, [user, loading, router]);

  const handleLogout = async () => {
    if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
      try {
        await signOut(auth);
        router.push("/");
      } catch (error) {
        console.error("Erreur déconnexion:", error);
      }
    }
  };

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div
                className="text-2xl font-bold text-green-600 cursor-pointer"
                onClick={() => router.push("/admin/dashboard")}
              >
                SIIIIIR RENT
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                ADMIN
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => router.push("/")}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Retour au site
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition font-medium"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
