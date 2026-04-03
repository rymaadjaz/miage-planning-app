# 📊 Projet Universitaire MIAGE 2026

## 📖 Description

Ce projet consiste à concevoir et développer une application web dédiée à la **gestion et planification des emplois du temps universitaires**.

L’application permet de centraliser les informations liées aux cours, aux salles et aux utilisateurs afin d’optimiser l’organisation académique. Elle répond aux problématiques classiques des universités :

- **Complexité de planification** : gérer des centaines de créneaux sans erreurs  
- **Multiplicité des acteurs** : étudiants, enseignants et administratifs  
- **Gestion des conflits** : éviter les chevauchements de ressources  

👉 **Objectif** : proposer un système **automatisé, clair et efficace**.

---

## 🎯 Objectifs

- 📅 **Planifier** les emplois du temps universitaires  
- 🔍 **Détecter** automatiquement les conflits  
- 🏫 **Gérer** les salles et ressources  
- 👨‍🏫 **Faciliter** la coordination entre acteurs  
- 📊 **Offrir** des outils de visualisation  

---

## ⚙️ Fonctionnalités principales

- **Gestion globale** : cours, examens et événements  
- **Visualisation personnalisée** : étudiant / enseignant / groupe  
- **Réservation de salles**  
- **Détection intelligente des conflits**  
- **Coordination multi-utilisateurs**  

---

## 🧠 Analyse Fonctionnelle

### 👥 Acteurs
- **Étudiant** : consultation du planning  
- **Enseignant** : gestion des cours et disponibilités  
- **Administratif** : gestion globale du système  

### 📌 Objectifs du système
- Organisation optimisée  
- Centralisation des données  
- Réduction des erreurs  
- Automatisation de la planification  

---

## 🏗️ Structure du projet

```bash
miage-planning-app/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── admin/
│   │   │   ├── hooks/
│   │   │   ├── layout/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   └── styles/
│   │   │
│   │   ├── enseignant/
│   │   │   ├── hooks/
│   │   │   └── pages/
│   │   │
│   │   ├── etudiant/
│   │   │   ├── hooks/
│   │   │   └── pages/
│   │   │
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── index.js
│   │
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── db/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│
├── docs/
├── README.md
├── journal.txt
├── Rapport Projet S6.md
└── package.json
```

---

## 🎨 Répartition Frontend

### 👩‍💻 Belkacemi CIRINE
- Réalisation de la maquette / conception visuelle de l’interface
- Login  
- Home  
- Navbar  
- Navigation/affichage du planning  
- Interface enseignant  
- Interface étudiant

### 👩‍💻 Lina EL HATHOUT
- Mise en place de la structure frontend
- Développement de l’interface administrateur :
- Dashboard administrateur
- Gestion des réservations
- Gestion des utilisateurs
- Gestion des salles
- Gestion des conflits


## 🔧 Backend & Logique

### 👩‍💻 Adjaz RYMA
- API REST (CRUD : Salles, Cours, Cohortes)  
- Logique de réservation  

### 👨‍💻 Youssef EDRIS
- Authentification & Sécurité (JWT)  
- Détection des conflits  
- Base de données  


## 🧱 Architecture Technique

### Stack
- Frontend : React.js  
- Backend : Node.js + Express  
- Base de données : SQLite  

### Architecture
- Client / Serveur  
- MVC (Model - Controller - Routes)  
- API REST  

---

## 🚀 Installation

```bash
git clone https://github.com/Edris-Y/miage-planning-app
cd miage-planning-app

# Backend
cd server
npm install
node db/initDb.js
npm run dev

# Frontend
cd ../client
npm install
npm start
```

---

## 📅 Organisation du projet

### Livrables
- Code source  
- Journal Git  
- Documentation  
- Démo  

### Soutenance
- Démo  
- Présentation  

---

## 📌 Équipe

- Lina EL HATHOUT  
- Youssef EDRIS  
- Belkacemi CIRINE  
- Adjaz RYMA  




## 📝 Licence

Projet universitaire MIAGE 2026.
