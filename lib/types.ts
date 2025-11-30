import { Timestamp } from "firebase/firestore";
/**
 * Types TypeScript pour SIIIIIR Rent
 */

// Rôles utilisateur
export type UserRole = "loueur" | "locataire";

// Document utilisateur dans Firestore
export interface UserDoc {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  photoURL?: string;
  createdAt?: any;
}

// Types de véhicules disponibles
export type VehicleType =
  | "berline"
  | "suv"
  | "citadine"
  | "utilitaire"
  | "moto"
  | "4x4"
  | "van"; // ✅ Ajouté

// Types de transmission
export type TransmissionType = "manuelle" | "automatique";

// Types de carburant
export type FuelType = "essence" | "diesel" | "electrique" | "hybride";

// Statuts de disponibilité du véhicule
export type VehicleStatus =
  | "disponible"
  | "loue"
  | "en_revision"
  | "en_reparation"
  | "non_disponible";

// Document véhicule dans Firestore
export interface Vehicle {
  id: string;
  userId: string;
  marque: string;
  modele: string;
  annee: number;
  immatriculation?: string;
  type: VehicleType;
  transmission: TransmissionType;
  carburant: FuelType;
  places: number;
  prix: number;
  statut: VehicleStatus;
  ville: string;
  adresse?: string;
  photos: string[];
  description: string;
  equipements: string[];
  createdAt: any;
  updatedAt: any;
}

// Données du formulaire
export interface VehicleFormData {
  marque: string;
  modele: string;
  annee: number;
  immatriculation?: string;
  type: VehicleType;
  transmission: TransmissionType;
  carburant: FuelType;
  places: number;
  prix: number;
  statut: VehicleStatus;
  ville: string;
  adresse?: string;
  description: string;
  equipements: string[];
}

// Statuts de réservation
export type ReservationStatus =
  | "en_attente"
  | "confirmee"
  | "en_cours"
  | "terminee"
  | "annulee";

// Statuts de paiement
export type PaymentStatus = "non_paye" | "paye";

// Types de méthode de paiement
export type PaymentMethod = "cash" | "cmi" | "bank_transfer";

// 📝 Types pour les contrats
export interface Contract {
  url: string;
  signedByRenter: boolean;
  signedByOwner: boolean;
  ownerSignature?: string;
  renterSignature?: string;
  ownerSignatureUrl?: string;
  renterSignatureUrl?: string;
  ownerSignatureBase64?: string;
  renterSignatureBase64?: string;
  createdAt: any;
  signedAt?: any;
}

// ==========================================
// TYPES CHECK-IN / CHECK-OUT
// ==========================================

export type CheckStatus =
  | "confirmee"
  | "checkin_en_attente_locataire"
  | "checkin_en_attente_validation"
  | "en_cours"
  | "checkout_en_attente_locataire"
  | "checkout_en_attente_validation"
  | "terminee"
  | "litige";

export type PhotoType =
  | "avant"
  | "arriere"
  | "cote_gauche"
  | "cote_droit"
  | "interieur"
  | "kilometrage"
  | "carburant"
  | "defauts";

export interface CheckPhoto {
  type: PhotoType;
  url: string;
  uploadedAt: any;
  uploadedBy: string;
}

export interface CheckInData {
  photos: CheckPhoto[];
  kilometrage: number;
  carburant: "plein" | "3/4" | "1/2" | "1/4" | "vide";
  notes?: string;
  signatureLocataire: string;
  createdAt: any;
  createdBy: string;
  validatedAt?: any;
  validatedBy?: string;
  signatureLoueur?: string;
  pdfUrl?: string;
}

export interface CheckOutData {
  photos: CheckPhoto[];
  kilometrage: number;
  carburant: "plein" | "3/4" | "1/2" | "1/4" | "vide";
  notes?: string;
  signatureLocataire: string;
  createdAt: any;
  createdBy: string;
  validatedAt?: any;
  validatedBy?: string;
  signatureLoueur?: string;
  pdfUrl?: string;
  litige?: {
    declared: boolean;
    reason?: string;
    photosSupplementaires?: string[];
    montantReclame?: number;
    declaredAt?: any;
    declaredBy?: string;
  };
}

// Document réservation dans Firestore
export interface Reservation {
  id: string;
  vehicleId: string;
  loueurId: string;
  locataireId: string;
  vehicleMarque: string;
  vehicleModele: string;
  vehiclePhoto?: string;
  vehiclePrixJour: number;
  vehicleImmatriculation?: string;
  locataireNom: string;
  locataireEmail: string;
  locatairePhone?: string;

  // Infos locataire complètes
  prenom?: string;
  nom?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  dateNaissance?: any;
  numeroCIN?: string;
  dateValiditePermis?: any;
  numeroPermis?: string;

  // Horaires et lieux
  heureDebut?: string;
  heureFin?: string;
  lieuDepart?: string;
  lieuRetour?: string;
  kmDepart?: number;
  kmRetour?: number;

  dateDebut: any;
  dateFin: any;
  nbJours: number;
  prixTotal: number;
  status: ReservationStatus;
  createdAt: any;
  updatedAt: any;
  contract?: Contract;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
  ownerName?: string;
  ownerEmail?: string;

  // Pour les réservations "invité" (sans compte)
  renterTmpId?: string;
  renterName?: string;
  renterEmail?: string;
  renterPhone?: string;

  // Nom générique véhicule
  vehicleName?: string;

  // Dates au nouveau format
  startDate?: any;
  endDate?: any;

  // Prix total version "totalPrice"
  totalPrice?: number;

  // Signature locataire
  renterSignature?: string | null;

  // Annulation
  cancelledAt?: any;
  cancelledBy?: "locataire" | "proprietaire";

  // Check-in/Check-out
  checkStatus?: CheckStatus;
  checkin?: CheckInData;
  checkout?: CheckOutData;
}

// Types pour les informations entreprise (Maroc)
export interface CompanyInfo {
  nomSociete?: string;
  ice?: string;
  patente?: string;
  registreCommerce?: string;
  formeJuridique?:
    | "SARL"
    | "SA"
    | "SNC"
    | "SCS"
    | "SCA"
    | "Auto-entrepreneur"
    | "Autre";
  adresseSociete?: string;
  villeSociete?: string;
  telephoneSociete?: string;
  documents?: {
    patentePDF?: {
      url?: string;
      uploadedAt?: any;
      verified?: boolean;
    };
    registreCommercePDF?: {
      url?: string;
      uploadedAt?: any;
      verified?: boolean;
    };
  };
}

// Types pour le profil utilisateur étendu
export interface UserProfile extends UserDoc {
  prenom?: string;
  nom?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  codePostal?: string;
  dateNaissance?: any;

  // Numéros des pièces d'identité
  numeroCIN?: string;
  numeroPermis?: string;
  dateValiditePermis?: any;

  documents?: {
    cni?: {
      recto?: string;
      verso?: string;
      verified?: boolean;
      uploadedAt?: any;
    };
    permis?: {
      recto?: string;
      verso?: string;
      verified?: boolean;
      uploadedAt?: any;
    };
  };
  companyInfo?: CompanyInfo;
  profileCompleted?: boolean;
  kycStatus?: "pending" | "submitted" | "verified" | "rejected";
}

// Type pour les mises à jour du profil
// Type pour les mises à jour du profil
export type UserProfileUpdate = Partial<
  Omit<UserProfile, "uid" | "email" | "createdAt">
>;
// ========== 🔥 NOUVEAU TYPE : CONTRACT SETTINGS ==========
export interface ContractSettings {
  // Informations société
  companyName: string;
  companyLogoUrl?: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website?: string;

  // Informations légales
  ice?: string;
  rc?: string;
  if?: string;
  patente?: string;
  cnss?: string;

  // Représentant légal
  representantName?: string;
  representantCIN?: string;

  // Conditions particulières
  conditionsParticulieres?: string;

  // Options d'affichage
  showRC: boolean;
  showICE: boolean;
  showIF: boolean;
  showPatente: boolean;
  showCNSS: boolean;

  // Metadata
  createdAt?: any;
  updatedAt?: any;
}

// Valeurs par défaut pour les settings de contrat
export const defaultContractSettings: Partial<ContractSettings> = {
  companyName: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  showRC: true,
  showICE: true,
  showIF: true,
  showPatente: true,
  showCNSS: true,
};

// ========== TYPES POUR LES INSPECTIONS ==========

export type InspectionType = "checkin" | "checkout";

export type InspectionStatus = "en_cours" | "termine";

export type QualityLevel = "excellent" | "bon" | "moyen" | "mauvais";

export type FluidLevel = "bon" | "moyen" | "bas";

export type PhotoCategory =
  | "avant"
  | "arriere"
  | "cote_gauche"
  | "cote_droit"
  | "interieur"
  | "compteur"
  | "autres";

export type SignedBy = "loueur" | "locataire";

export interface InspectionPhoto {
  url: string;
  category: PhotoCategory;
  uploadedAt: string;
  uploadedBy?: string;
  storagePath?: string;
}

export interface CarrosserieChecklist {
  rayures: boolean;
  rayuresDetails?: string;
  bosses: boolean;
  bossesDetails?: string;
  peinture: QualityLevel;
  peintureDetails?: string;
}

export interface MecaniqueChecklist {
  moteur: QualityLevel;
  freins: QualityLevel;
  suspension: QualityLevel;
  autresProblemes?: string;
}

export interface InterieurChecklist {
  sieges: QualityLevel;
  tableauBord: QualityLevel;
  proprete: QualityLevel;
  odeur: boolean;
  odeurDetails?: string;
}

export interface PneusChecklist {
  avantGauche: QualityLevel;
  avantDroit: QualityLevel;
  arriereGauche: QualityLevel;
  arriereDroit: QualityLevel;
  roueSecours: boolean;
}

export interface NiveauxChecklist {
  carburant: number;
  kilometrage: number;
  huile: FluidLevel;
  liquideRefroidissement: FluidLevel;
  liquideFrein: FluidLevel;
}

export interface EquipementsChecklist {
  triangleSignalisation: boolean;
  giletSecurite: boolean;
  extincteur: boolean;
  trousseSecours: boolean;
  cric: boolean;
  cleRoues: boolean;
  documentsBord: boolean;
}

export interface InspectionChecklist {
  carrosserie: CarrosserieChecklist;
  mecanique: MecaniqueChecklist;
  interieur: InterieurChecklist;
  pneus: PneusChecklist;
  niveaux: NiveauxChecklist;
  equipements: EquipementsChecklist;
}

export interface Inspection {
  id: string;
  reservationId: string;
  vehicleId: string;
  loueurId: string;
  locataireId: string;
  type: InspectionType;
  photos: InspectionPhoto[];
  checklist: InspectionChecklist;
  observations?: string;
  signature?: string;
  signedBy: SignedBy;
  signedAt?: Timestamp;
  pdfUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  status: InspectionStatus;
}

// Valeurs par défaut
export const defaultChecklist: InspectionChecklist = {
  carrosserie: {
    rayures: false,
    bosses: false,
    peinture: "excellent",
  },
  mecanique: {
    moteur: "excellent",
    freins: "excellent",
    suspension: "excellent",
  },
  interieur: {
    sieges: "excellent",
    tableauBord: "excellent",
    proprete: "excellent",
    odeur: false,
  },
  pneus: {
    avantGauche: "excellent",
    avantDroit: "excellent",
    arriereGauche: "excellent",
    arriereDroit: "excellent",
    roueSecours: true,
  },
  niveaux: {
    carburant: 100,
    kilometrage: 0,
    huile: "bon",
    liquideRefroidissement: "bon",
    liquideFrein: "bon",
  },
  equipements: {
    triangleSignalisation: true,
    giletSecurite: true,
    extincteur: true,
    trousseSecours: true,
    cric: true,
    cleRoues: true,
    documentsBord: true,
  },
};

export const photoCategoryLabels: Record<PhotoCategory, string> = {
  avant: "Avant",
  arriere: "Arrière",
  cote_gauche: "Côté gauche",
  cote_droit: "Côté droit",
  interieur: "Intérieur",
  compteur: "Compteur kilométrique",
  autres: "Autres",
};

export const qualityLevelLabels: Record<QualityLevel, string> = {
  excellent: "Excellent",
  bon: "Bon",
  moyen: "Moyen",
  mauvais: "Mauvais",
};

export const fluidLevelLabels: Record<FluidLevel, string> = {
  bon: "Bon",
  moyen: "Moyen",
  bas: "Bas",
};

// ========== TYPES POUR LES PAIEMENTS ==========

export interface Payment {
  id: string;
  reservationId: string;
  montant: number;
  methode: PaymentMethod;
  status: PaymentStatus;
  payePar: string;
  recuPar: string;
  dateCreation: any;
  datePaiement?: any;
  recuPdfUrl?: string;
  notes?: string;
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Espèces",
  cmi: "Carte bancaire (CMI)",
  bank_transfer: "Virement bancaire",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  non_paye: "Non payé",
  paye: "Payé",
};

// ===== BLOCKED DATES =====
export interface BlockedDate {
  id: string;
  vehicleId: string;
  date: Timestamp;
  reason: "maintenance" | "manual" | "reserved" | "other";
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
}
