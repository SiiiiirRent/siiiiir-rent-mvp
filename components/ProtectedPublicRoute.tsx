"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ProtectedPublicRouteProps {
  children: React.ReactNode;
}

export default function ProtectedPublicRoute({
  children,
}: ProtectedPublicRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log("🔐 ProtectedPublicRoute - Vérification auth...");
    console.log("🔐 user:", user);
    console.log("🔐 loading:", loading);
    console.log("🔐 pathname:", pathname);

    // Attendre la fin du chargement auth
    if (loading) {
      console.log("⏳ Attente vérification auth...");
      return;
    }

    // Si pas d'utilisateur → rediriger vers login
    if (!user) {
      console.error("❌ Utilisateur non connecté - Redirection vers /login");
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirectUrl}`);
      return;
    }

    // User connecté → OK
    console.log("✅ Utilisateur connecté:", user.email);
    setIsChecking(false);
  }, [user, loading, router, pathname]);

  // Afficher loader pendant vérification
  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Vérification de votre connexion...
          </p>
        </div>
      </div>
    );
  }

  // Si on arrive ici, user est connecté
  return <>{children}</>;
}
