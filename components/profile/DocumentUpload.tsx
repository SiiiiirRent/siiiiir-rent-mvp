"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadKYCDocument, deleteKYCDocument } from "@/lib/users";

interface DocumentUploadProps {
  uid: string;
  documentType: "cni" | "permis";
  side: "recto" | "verso";
  currentURL?: string;
  onUploadSuccess: () => void;
}

export default function DocumentUpload(props: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const labels: any = {
    cni: "CNI",
    permis: "Permis",
  };

  const sides: any = {
    recto: "Recto",
    verso: "Verso",
  };

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await uploadKYCDocument(
        props.uid,
        selectedFile,
        props.documentType,
        props.side
      );
      alert("Document uploadé");
      setSelectedFile(null);
      props.onUploadSuccess();
    } catch (err) {
      alert("Erreur");
    }
    setUploading(false);
  }

  async function handleDelete() {
    if (!confirm("Supprimer ?")) return;
    setUploading(true);
    try {
      await deleteKYCDocument(props.uid, props.documentType, props.side);
      alert("Supprimé");
      props.onUploadSuccess();
    } catch (err) {
      alert("Erreur");
    }
    setUploading(false);
  }

  const title = labels[props.documentType] + " " + sides[props.side];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">{title}</h4>

      {props.currentURL && (
        <div className="mb-4">
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={props.currentURL}
              alt="Doc"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {!props.currentURL && (
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          disabled={uploading}
          className="w-full mb-4 text-sm"
        />
      )}

      {!props.currentURL && selectedFile && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg mb-2"
        >
          {uploading ? "Upload..." : "Uploader"}
        </button>
      )}

      {props.currentURL && (
        <div className="flex gap-2">
          <a
            href={props.currentURL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-center text-sm"
          >
            Voir
          </a>
          <button
            onClick={handleDelete}
            disabled={uploading}
            className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm"
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
