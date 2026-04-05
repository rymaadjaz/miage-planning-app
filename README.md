# Plateforme de Gestion Intégrée des Emplois du Temps Universitaires
## Projet Universitaire MIAGE 2026

## Description

Ce projet a pour objectif de concevoir et développer une **application web de gestion et de planification des emplois du temps universitaires**.

L’application permet de centraliser les informations liées aux **cours**, **examens**, **salles**, **utilisateurs** et **réservations**, afin d’améliorer l’organisation académique au sein d’un établissement universitaire.

Elle répond à plusieurs problématiques fréquentes :

- **Complexité de planification** : gérer de nombreux créneaux sans erreurs
- **Multiplicité des acteurs** : étudiants, enseignants et administratifs
- **Gestion des conflits** : éviter les chevauchements de salles, de cours ou de ressources

**Objectif principal :** proposer un système **clair, structuré et automatisé** pour faciliter la gestion des emplois du temps universitaires.

---

## Fonctionnalités principales

L’application propose plusieurs fonctionnalités permettant de gérer efficacement l’organisation universitaire :

- **Gestion des cours, examens et événements**
- **Consultation personnalisée des emplois du temps**
- **Réservation de salles**
- **Détection des conflits de planification**
- **Gestion des utilisateurs et des ressources**
- **Coordination entre les différents profils utilisateurs**
- **Génération automatique du planning**

---

## Fonctionnalités par profil

### Étudiant
- Consultation du planning personnel
- Visualisation des séances, examens et événements
- Consultation des notifications

### Enseignant
- Consultation du planning enseignant
- Gestion des disponibilités
- Consultation des demandes et réservations
- Suivi des notifications

### Administratif
- Tableau de bord avec indicateurs globaux
- Gestion des réservations
- Gestion des salles
- Gestion des utilisateurs
- Gestion des conflits
- Déclenchement de la génération automatique du planning

---

## Démonstration de connexion

L’application propose une **page de connexion unique**.  
Après authentification, l’utilisateur est redirigé automatiquement vers son espace selon son rôle.

### Comptes de démonstration

- **Étudiant** : `edris.youssef@univ.fr`
- **Enseignant** : `prof.beduneau@univ.fr`
- **Administratif** : `admin.planning@univ.fr`

### Mot de passe de test

- `changeme`

### Parcours de connexion

1. Ouvrir la page de connexion
2. Saisir l’adresse email + mot de passe
3. Fonctionnalité de mot de passe oublié :
- envoie un lien sécurisé par e-mail pour permettre à l’utilisateur de réinitialiser son mot de passe depuis sa messagerie par défaut.


- **Étudiant** → tableau de bord et planning personnel
- **Enseignant** → outils de consultation et de gestion
- **Administratif** → dashboard d’administration

---

## Analyse fonctionnelle

### Acteurs

- **Étudiant** : consulte son emploi du temps
- **Enseignant** : consulte son planning et gère certaines demandes
- **Administratif** : gère l’ensemble du système

### Objectifs du système

- Optimiser l’organisation universitaire
- Centraliser les données liées au planning
- Réduire les erreurs de planification
- Automatiser certaines tâches de gestion

---

## Architecture technique

### Stack utilisée

#### Frontend
- React.js
- React Router DOM
- CSS

#### Backend
- Node.js
- Express.js
- JWT pour l’authentification

#### Base de données
- SQLite

#### Outils
- Git / GitHub
- VS Code
- Postman

### Architecture du projet

Le projet suit une architecture de type :

- **Client / Serveur**
- **MVC (Model - Controller - Routes)**
- **API REST**

---

## Structure du projet

```bash
miage-planning-app/
├── client/
│   ├── public/
│   └── src/
│       ├── admin/
│       │   ├── hooks/
│       │   ├── layout/
│       │   ├── pages/
│       │   └── styles/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── data/
│       ├── enseignant/
│       │   └── pages/
│       ├── etudiant/
│       │   └── pages/
│       ├── pages/
│       ├── services/
│       ├── styles/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       └── index.js
│
├── docs/
│
├── server/
│   ├── controllers/
│   ├── db/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   └── database.db
│
├── journal.txt
└── README.md
```

---

##  Répartition Frontend

### 👩‍💻 Belkacemi CIRINE
- Réalisation de la maquette / conception visuelle de l’interface
- Login  
- Navbar  
- Navigation/affichage du planning  
- Interface enseignant  
- Interface étudiant
- Intégration de la logique des pages et des interactions utilisateur

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
- API REST (CRUD : Salles, Cours, Cohortes ,conflit ,matieres, notifications, disponibilite,dashboard, equipements, historiques)
- Gestion du planning (étudiant / enseignant / administrateur) 
- Gestion des conflits
- Gestion des reservations

### 👨‍💻 Youssef EDRIS
- Authentification & Sécurité (JWT)  
- Détection des conflits  
- Base de données
- Gestion des conflits
- Gestion des reservations


##  Architecture Technique

### Stack
- Frontend : React.js  
- Backend : Node.js + Express  
- Base de données : SQLite  

### Architecture
- Client / Serveur  
- MVC (Model - Controller - Routes)  
- API REST  

---

##  Installation

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

##  Organisation du projet

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




##  Licence

Projet universitaire MIAGE 2026.
