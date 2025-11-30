/**
 * lib/vehicles.ts
 * Logique métier pour la gestion des véhicules
 */

import { db, storage } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { Vehicle, VehicleFormData } from "./types";

/**
 * Récupérer un véhicule par son ID
 */
export async function getVehicle(vehicleId: string): Promise<Vehicle | null> {
  try {
    const vehicleRef = doc(db, "vehicles", vehicleId);
    const vehicleSnap = await getDoc(vehicleRef);

    if (!vehicleSnap.exists()) {
      console.log("Véhicule introuvable");
      return null;
    }

    return { id: vehicleSnap.id, ...vehicleSnap.data() } as Vehicle;
  } catch (error) {
    console.error("Erreur getVehicle:", error);
    throw error;
  }
}

/**
 * Récupérer tous les véhicules d'un utilisateur
 */
export async function getUserVehicles(userId: string): Promise<Vehicle[]> {
  try {
    const vehiclesRef = collection(db, "vehicles");
    const q = query(
      vehiclesRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const vehicles: Vehicle[] = [];
    snapshot.forEach((doc) => {
      vehicles.push({ id: doc.id, ...doc.data() } as Vehicle);
    });

    return vehicles;
  } catch (error) {
    console.error("Erreur getUserVehicles:", error);
    throw error;
  }
}

/**
 * Créer un nouveau véhicule
 */
export async function createVehicle(
  userId: string,
  vehicleData: VehicleFormData,
  photos: string[]
): Promise<string> {
  try {
    const vehiclesRef = collection(db, "vehicles");

    const newVehicle = {
      userId,
      ...vehicleData,
      photos,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(vehiclesRef, newVehicle);

    console.log("✅ Véhicule créé:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Erreur createVehicle:", error);
    throw error;
  }
}

/**
 * Mettre à jour un véhicule
 */
export async function updateVehicle(
  vehicleId: string,
  vehicleData: Partial<VehicleFormData>,
  photos?: string[]
): Promise<void> {
  try {
    const vehicleRef = doc(db, "vehicles", vehicleId);

    const updateData: any = {
      ...vehicleData,
      updatedAt: serverTimestamp(),
    };

    if (photos) {
      updateData.photos = photos;
    }

    await updateDoc(vehicleRef, updateData);

    console.log("✅ Véhicule mis à jour");
  } catch (error) {
    console.error("❌ Erreur updateVehicle:", error);
    throw error;
  }
}

/**
 * Supprimer un véhicule
 */
export async function deleteVehicle(vehicleId: string): Promise<void> {
  try {
    // Récupérer le véhicule pour supprimer les photos
    const vehicle = await getVehicle(vehicleId);

    if (vehicle && vehicle.photos && vehicle.photos.length > 0) {
      // Supprimer les photos du Storage
      for (const photoURL of vehicle.photos) {
        try {
          const photoRef = ref(storage, photoURL);
          await deleteObject(photoRef);
        } catch (error) {
          console.warn("Photo Storage déjà supprimée ou introuvable");
        }
      }
    }

    // Supprimer le document Firestore
    const vehicleRef = doc(db, "vehicles", vehicleId);
    await deleteDoc(vehicleRef);

    console.log("✅ Véhicule supprimé");
  } catch (error) {
    console.error("❌ Erreur deleteVehicle:", error);
    throw error;
  }
}

/**
 * Upload photos véhicule
 */
export async function uploadVehiclePhotos(
  userId: string,
  vehicleId: string,
  files: File[]
): Promise<string[]> {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop();
      const fileName = `photo_${index}_${timestamp}.${fileExtension}`;
      const storageRef = ref(
        storage,
        `vehicles/${userId}/${vehicleId}/${fileName}`
      );

      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    });

    const photoURLs = await Promise.all(uploadPromises);

    console.log("✅ Photos uploadées:", photoURLs.length);
    return photoURLs;
  } catch (error) {
    console.error("❌ Erreur uploadVehiclePhotos:", error);
    throw error;
  }
}
