"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Car, Shield, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const [searchCity, setSearchCity] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCity.trim()) {
      router.push(`/vehicules?ville=${encodeURIComponent(searchCity)}`);
    } else {
      router.push("/vehicules");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Navbar */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold">
                SIIIIIR <span className="text-green-600">RENT</span>
              </span>
            </Link>

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/vehicules"
                className="text-gray-700 hover:text-green-600 transition-colors"
              >
                Véhicules
              </Link>
              <Link
                href="/comment-ca-marche"
                className="text-gray-700 hover:text-green-600 transition-colors"
              >
                Comment ça marche
              </Link>
              <Link
                href="/devenir-loueur"
                className="text-gray-700 hover:text-green-600 transition-colors"
              >
                Devenir loueur
              </Link>
            </div>

            {/* Boutons connexion */}
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-green-600 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Inscription
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Louez la voiture parfaite
              <br />
              <span className="text-green-600">en quelques clics</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Des milliers de véhicules disponibles au Maroc. Location simple,
              rapide et sécurisée.
            </p>
          </div>

          {/* Barre de recherche */}
          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-4"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Où souhaitez-vous louer ?"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                <Search className="w-5 h-5" />
                Rechercher
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Catégories populaires - AVEC VRAIES IMAGES ⬇️ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Catégories populaires
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                name: "Citadines",
                imageUrl:
                  "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&auto=format&fit=crop",
                count: "120+",
              },
              {
                name: "SUV",
                imageUrl:
                  "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop",
                count: "85+",
              },
              {
                name: "Berlines",
                imageUrl:
                  "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop",
                count: "95+",
              },
              {
                name: "4x4",
                imageUrl:
                  "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop",
                count: "45+",
              },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/vehicules?type=${category.name.toLowerCase()}`}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-105"
              >
                {/* IMAGE DE LA VOITURE */}
                <div className="relative h-40 bg-gray-200">
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* TEXTE EN DESSOUS */}
                <div className="p-4 text-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {category.count} véhicules
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="w-8 h-8" />,
                title: "1. Recherchez",
                description:
                  "Trouvez le véhicule parfait parmi des centaines d'options",
              },
              {
                icon: <Car className="w-8 h-8" />,
                title: "2. Réservez",
                description:
                  "Réservez en ligne en quelques clics, paiement sécurisé",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "3. Conduisez",
                description:
                  "Récupérez votre véhicule et profitez de votre location",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Vous possédez un véhicule ?
          </h2>
          <p className="text-xl mb-8 text-green-100">
            Générez des revenus en le louant sur SIIIIIR Rent
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Devenir loueur
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">
                SIIIIIR <span className="text-green-500">RENT</span>
              </h3>
              <p className="text-sm">
                La plateforme de location de véhicules de confiance au Maroc
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/a-propos" className="hover:text-white">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Aide</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/faq" className="hover:text-white">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/conditions" className="hover:text-white">
                    Conditions
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Suivez-nous</h4>
              <div className="flex gap-4">
                <a
                  href="https://www.instagram.com/siiiiirrent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white text-green-400"
                >
                  Instagram
                </a>

                <a
                  href="https://www.tiktok.com/@siiiiirrent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white text-green-400"
                >
                  TikTok
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © 2025 SIIIIIR Rent. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
