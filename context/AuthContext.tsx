"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface UserRole {
  role: "loueur" | "locataire";
}

interface AuthContextType {
  user: User | null;
  userRole: "loueur" | "locataire" | null;
  loading: boolean;
  logout: () => Promise<void>;
  reloadUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  logout: async () => {},
  reloadUserRole: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"loueur" | "locataire" | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour charger le rôle
  const loadUserRole = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserRole;
        console.log("🔍 Rôle chargé depuis Firestore:", userData.role);
        setUserRole(userData.role);
        return true;
      } else {
        console.warn("⚠️ Document utilisateur introuvable");
        return false;
      }
    } catch (error) {
      console.error("❌ Erreur chargement rôle:", error);
      return false;
    }
  };

  // Fonction publique pour recharger le rôle
  const reloadUserRole = async () => {
    if (user) {
      await loadUserRole(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔄 Auth state changed:", user?.email);

      setUser(user);

      if (user) {
        // Essayer de charger le rôle immédiatement
        const loaded = await loadUserRole(user.uid);

        // Si échec, réessayer après 1 seconde
        if (!loaded) {
          console.log("⏳ Réessai dans 1 seconde...");
          setTimeout(async () => {
            await loadUserRole(user.uid);
          }, 1000);
        }
      } else {
        setUserRole(null);
      }

      // ✅ TOUJOURS terminer le loading
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, userRole, loading, logout, reloadUserRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
