# 🚀 SIIIIIR RENT - STARTER KIT V1

## 📋 Description

Starter kit complet pour SIIIIIR Rent MVP : plateforme de location de véhicules au Maroc.

**Stack :**

- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- Firebase (Auth + Firestore + Storage)

---

## ⚡ Installation

### 1. Cloner/Télécharger les fichiers

Récupère tous les fichiers créés et place-les dans ton dossier `siiiiir-rent-mvp/`.

### 2. Installer les dépendances

```bash
cd siiiiir-rent-mvp
npm install
```

### 3. Configurer Firebase

#### A. Créer un projet Firebase

1. Va sur https://console.firebase.google.com
2. Clique sur "Ajouter un projet"
3. Nom : **SIIIIIR Rent MVP**
4. Désactive Google Analytics
5. Clique sur "Créer le projet"

#### B. Activer Authentication

1. Menu "Authentication" → "Commencer"
2. Active "Email/Password"
3. Enregistrer

#### C. Activer Firestore Database

1. Menu "Firestore Database" → "Créer une base de données"
2. Mode test (pour le dev)
3. Région : `europe-west1` (proche Maroc)
4. Activer

#### D. Activer Storage

1. Menu "Storage" → "Commencer"
2. Mode test
3. OK

#### E. Récupérer les clés

1. Paramètres du projet (icône engrenage)
2. "Vos applications" → Icône `</>`
3. Nom : **SIIIIIR Rent Web**
4. Copie toutes les clés

### 4. Configurer `.env.local`

Ouvre le fichier `.env.local` et **remplace** les valeurs par tes vraies clés Firebase :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=ta_vraie_clé_ici
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ton-projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ton-projet-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ton-projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

⚠️ **Important :** Ne commit JAMAIS ce fichier sur GitHub (il est déjà dans `.gitignore`).

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvre http://localhost:3000 dans ton navigateur.

---

## ✅ Tester l'authentification

### Étape 1 : Créer un compte

1. Va sur http://localhost:3000
2. Clique sur "Inscription"
3. Remplis le formulaire
4. Clique sur "Créer mon compte"
5. Tu es automatiquement redirigé vers `/dashboard`

### Étape 2 : Vérifier dans Firebase

1. Va dans Firebase Console
2. Menu "Authentication"
3. Tu dois voir ton utilisateur créé ✅
4. Menu "Firestore Database"
5. Collection `users` → Tu dois voir ton document utilisateur ✅

### Étape 3 : Tester la connexion

1. Clique sur "Déconnexion" dans le dashboard
2. Va sur `/login`
3. Entre tes identifiants
4. Tu dois être redirigé vers `/dashboard` ✅

### Étape 4 : Tester les guards

**Test RequireAuth :**

- Déconnecte-toi
- Essaie d'aller sur `/dashboard` directement
- Tu dois être redirigé vers `/login` ✅

**Test RedirectIfAuth :**

- Connecte-toi
- Essaie d'aller sur `/login` ou `/register`
- Tu dois être redirigé vers `/dashboard` ✅

---

## 🏗️ Structure du projet

```
siiiiir-rent-mvp/
├── app/
│   ├── layout.tsx              # Layout global + AuthProvider
│   ├── page.tsx                # Homepage
│   ├── globals.css             # Styles globaux
│   ├── login/
│   │   └── page.tsx           # Page de connexion
│   ├── register/
│   │   └── page.tsx           # Page d'inscription
│   └── dashboard/
│       ├── layout.tsx         # Layout dashboard (protégé)
│       └── page.tsx           # Page dashboard
│
├── components/
│   ├── auth/
│   │   ├── RequireAuth.tsx    # Guard pages protégées
│   │   └── RedirectIfAuth.tsx # Guard pages publiques
│   └── ui/
│       └── Button.tsx         # Bouton réutilisable
│
├── context/
│   └── AuthContext.tsx        # Context d'authentification
│
├── lib/
│   ├── firebase.ts            # Config Firebase
│   └── types.ts               # Types TypeScript
│
├── .env.local                 # Variables d'environnement (à configurer)
├── .gitignore                 # Fichiers à ignorer par Git
├── next.config.ts             # Config Next.js
├── tailwind.config.ts         # Config Tailwind
├── package.json               # Dépendances
└── README.md                  # Ce fichier
```

---

## 🔥 Commandes utiles

```bash
# Lancer le serveur de dev
npm run dev

# Build production
npm run build

# Lancer en production
npm start

# Linter (vérifier le code)
npm run lint
```

---

## 📚 Prochaines étapes

Maintenant que l'authentification fonctionne, tu peux développer :

1. **Module "Mes Véhicules"**

   - Page liste véhicules
   - Formulaire ajout véhicule
   - Upload photos
   - CRUD complet

2. **Module "Recherche"**

   - Barre de recherche
   - Filtres
   - Carte véhicule
   - Détail véhicule

3. **Module "Réservations"**
   - Calendrier disponibilité
   - Formulaire réservation
   - Gestion réservations

---

## 🆘 Problèmes courants

### Erreur : "Firebase already initialized"

**Solution :** Redémarre le serveur (`Ctrl+C` puis `npm run dev`)

### Erreur : "Variable d'environnement manquante"

**Solution :** Vérifie que tu as bien créé `.env.local` avec toutes les clés Firebase.

### La redirection ne fonctionne pas

**Solution :** Vide le cache du navigateur et réessaie.

### Erreur de type TypeScript

**Solution :** Arrête le serveur et relance : `npm run dev`

---

## 🎯 Checklist de vérification

- [ ] Firebase configuré (Auth + Firestore + Storage activés)
- [ ] `.env.local` créé avec les bonnes clés
- [ ] `npm install` exécuté
- [ ] Serveur lancé avec `npm run dev`
- [ ] Création de compte fonctionne
- [ ] Connexion fonctionne
- [ ] Déconnexion fonctionne
- [ ] Dashboard accessible uniquement si connecté
- [ ] Login/Register redirigent si déjà connecté

---

## 💪 Tu as réussi si...

✅ Tu peux créer un compte
✅ Tu peux te connecter
✅ Tu peux accéder au dashboard
✅ Tu es redirigé vers `/login` si tu essaies d'accéder au dashboard sans être connecté
✅ Tu es redirigé vers `/dashboard` si tu essaies d'accéder à `/login` en étant connecté

---

## 🚀 Message final

**Félicitations Aimad !**

Tu as maintenant une base 100% propre, moderne et scalable pour SIIIIIR Rent.

**L'authentification fonctionne parfaitement.**

Prochaine étape : développer le module "Mes Véhicules" pour que les loueurs puissent ajouter leurs véhicules.

**Let's build something amazing ! 💚**

---

**Créé avec 💚 par Aimad Ben Hammi**
**Powered by Next.js + Firebase + TypeScript**
