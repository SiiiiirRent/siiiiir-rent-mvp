// components/whatsapp/ShareWhatsAppButton.tsx
"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

interface ShareWhatsAppButtonProps {
  whatsappUrl: string;
  label?: string;
  variant?: "default" | "icon" | "small" | "large";
  className?: string;
  onClick?: () => void;
}

export default function ShareWhatsAppButton({
  whatsappUrl,
  label = "Partager sur WhatsApp",
  variant = "default",
  className = "",
  onClick,
}: ShareWhatsAppButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }

    // Ouvre WhatsApp dans une nouvelle fenêtre
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  // ==========================================
  // VARIANTES DE STYLE
  // ==========================================

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors ${className}`}
        title={label}
        aria-label={label}
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    );
  }

  if (variant === "small") {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors ${className}`}
      >
        <MessageCircle className="w-4 h-4" />
        <span>{label}</span>
      </button>
    );
  }

  if (variant === "large") {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-3 px-6 py-3 text-base font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors shadow-md hover:shadow-lg ${className}`}
      >
        <MessageCircle className="w-6 h-6" />
        <span>{label}</span>
      </button>
    );
  }

  // Variant "default"
  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors ${className}`}
    >
      <MessageCircle className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}
