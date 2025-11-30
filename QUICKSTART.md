# ⚡ QUICKSTART - SIIIIIR RENT

## 🚀 Démarrage en 5 minutes

### 1️⃣ Installation

```bash
# Installer les dépendances
npm install
```

### 2️⃣ Configuration Firebase

1. Crée un projet sur https://console.firebase.google.com
2. Active **Authentication** (Email/Password)
3. Active **Firestore Database** (mode test)
4. Active **Storage** (mode test)
5. Copie tes clés Firebase

### 3️⃣ Configuration `.env.local`

Crée le fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=ta_clé
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ton-projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ton-projet
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ton-projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4️⃣ Lancement

```bash
# Lancer le serveur
npm run dev
```

Ouvre http://localhost:3000

### 5️⃣ Test

1. Clique sur "Inscription"
2. Crée un compte
3. Tu es redirigé vers le dashboard ✅

---

## 📁 Fichiers principaux

| Fichier                           | Description              |
| --------------------------------- | ------------------------ |
| `lib/firebase.ts`                 | Configuration Firebase   |
| `context/AuthContext.tsx`         | Gestion authentification |
| `components/auth/RequireAuth.tsx` | Protège les pages        |
| `app/dashboard/page.tsx`          | Page protégée exemple    |

---

## 🔥 Commandes essentielles

```bash
npm run dev      # Lancer le serveur
npm run build    # Build production
npm start        # Production
npm run lint     # Vérifier le code
```

---

## ✅ Checklist rapide

- [ ] `npm install` ✅
- [ ] Firebase configuré ✅
- [ ] `.env.local` créé ✅
- [ ] Serveur lancé ✅
- [ ] Compte créé ✅
- [ ] Connexion testée ✅

---

## 🆘 Problème ?

1. Vérifie que `.env.local` contient les bonnes clés
2. Redémarre le serveur (`Ctrl+C` puis `npm run dev`)
3. Vide le cache du navigateur

---

**C'est tout ! Tu es prêt à développer ! 🚀**
