import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIIIIIR Rent - Location de véhicules",
  description: "Louez votre véhicule en quelques clics",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                <span className="text-gray-900">SIIIIIR</span>{" "}
                <span className="text-green-600">RENT</span>
              </h1>
            </div>
          </div>
        </header>

        <main className="min-h-screen bg-gray-50">{children}</main>

        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-gray-400">
              © 2025 SIIIIIR Rent - Location de véhicules au Maroc
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
