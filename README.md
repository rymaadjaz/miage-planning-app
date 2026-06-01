<div align="center">

# 🎓 MIAGE Planning App

### Plateforme de Gestion Intégrée des Emplois du Temps Universitaires

![Version](https://img.shields.io/badge/version-1.0.0-6C63FF?style=for-the-badge)
![Licence](https://img.shields.io/badge/licence-Universitaire-blueviolet?style=for-the-badge)
![Status](https://img.shields.io/badge/status-En%20développement-orange?style=for-the-badge)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

---

## 📋 Description

> **Application web de gestion et de planification des emplois du temps universitaires** — centralisant cours, examens, salles, utilisateurs et réservations pour améliorer l'organisation académique.

Elle répond à plusieurs problématiques fréquentes :

| Problématique | Solution apportée |
|---|---|
| 🧩 **Complexité de planification** | Génération automatique des créneaux |
| 👥 **Multiplicité des acteurs** | Espaces dédiés par profil (étudiant, enseignant, admin) |
| ⚠️ **Gestion des conflits** | Détection automatique des chevauchements |

---

## ✨ Fonctionnalités principales

<table>
<tr>
<td>📅 Gestion des cours, examens et événements</td>
<td>👤 Consultation personnalisée des emplois du temps</td>
</tr>
<tr>
<td>🏫 Réservation de salles</td>
<td>🔍 Détection des conflits de planification</td>
</tr>
<tr>
<td>⚙️ Gestion des utilisateurs et des ressources</td>
<td>🤝 Coordination entre les différents profils</td>
</tr>
<tr>
<td colspan="2" align="center">🤖 <strong>Génération automatique du planning</strong></td>
</tr>
</table>

---

## 🎭 Fonctionnalités par profil

<table>
<tr>
<th align="center">🎓 Étudiant</th>
<th align="center">👨‍🏫 Enseignant</th>
<th align="center">🛠️ Administratif</th>
</tr>
<tr>
<td>
• Consultation du planning personnel<br>
• Visualisation des séances, examens et événements<br>
• Consultation des notifications
</td>
<td>
• Consultation du planning enseignant<br>
• Gestion des disponibilités<br>
• Consultation des demandes et réservations<br>
• Suivi des notifications
</td>
<td>
• Tableau de bord avec indicateurs globaux<br>
• Gestion des réservations<br>
• Gestion des salles<br>
• Gestion des utilisateurs<br>
• Gestion des conflits<br>
• Génération automatique du planning
</td>
</tr>
</table>

---

## 🔐 Démonstration de connexion

L'application propose une **page de connexion unique**. Après authentification, l'utilisateur est redirigé automatiquement vers son espace selon son rôle.

### 👥 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| 🎓 Étudiant | `edris.youssef@univ.fr` | `changeme` |
| 👨‍🏫 Enseignant | `prof.beduneau@univ.fr` | `changeme` |
| 🛠️ Administratif | `admin.planning@univ.fr` | `changeme` |

### 🔄 Parcours de connexion

```
1. Ouvrir la page de connexion
2. Saisir l'adresse email + mot de passe
3. Mot de passe oublié → lien sécurisé envoyé par e-mail

   ┌───────────────────────────────────────────────┐
   │  Étudiant      → tableau de bord + planning   │
   │  Enseignant    → outils de consultation        │
   │  Administratif → dashboard d'administration   │
   └───────────────────────────────────────────────┘
```

---

## 🏗️ Architecture technique

<div align="center">

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (React.js)                 │
│         React Router DOM  ·  CSS Modules             │
└─────────────────────────┬───────────────────────────┘
                          │  API REST (JSON)
┌─────────────────────────▼───────────────────────────┐
│                SERVER (Node.js + Express)             │
│         JWT Auth  ·  MVC  ·  Services                │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│                   BASE DE DONNÉES                    │
│                      SQLite                          │
└─────────────────────────────────────────────────────┘
```

</div>

### 🔧 Stack technique

| Couche | Technologie | Badge |
|--------|------------|-------|
| Frontend | React.js + React Router | ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) |
| Backend | Node.js + Express.js | ![Node](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) |
| Auth | JWT | ![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) |
| Base de données | SQLite | ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white) |
| Versioning | Git / GitHub | ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white) |
| IDE | VS Code | ![VSCode](https://img.shields.io/badge/VS%20Code-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white) |
| Tests API | Postman | ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=flat-square&logo=postman&logoColor=white) |

---

## 📁 Structure du projet

```
miage-planning-app/
├── 📁 client/
│   ├── 📁 public/
│   └── 📁 src/
│       ├── 📁 admin/
│       │   ├── hooks/
│       │   ├── layout/
│       │   ├── pages/
│       │   └── styles/
│       ├── 📁 assets/
│       ├── 📁 components/
│       ├── 📁 context/
│       ├── 📁 data/
│       ├── 📁 enseignant/
│       │   └── pages/
│       ├── 📁 etudiant/
│       │   └── pages/
│       ├── 📁 pages/
│       ├── 📁 services/
│       ├── 📁 styles/
│       ├── App.jsx
│       └── index.js
│
├── 📁 docs/
│
├── 📁 server/
│   ├── 📁 controllers/
│   ├── 📁 db/
│   ├── 📁 middleware/
│   ├── 📁 models/
│   ├── 📁 routes/
│   ├── 📁 services/
│   ├── 📁 utils/
│   ├── server.js
│   └── database.db
│
├── 📄 journal.txt
└── 📄 README.md
```

---

## 🚀 Installation

```bash
# Cloner le dépôt
git clone https://github.com/Edris-Y/miage-planning-app
cd miage-planning-app

# ⚙️ Backend
cd server
npm install
node db/initDb.js
npm run dev

# 🎨 Frontend
cd ../client
npm install
npm start
```

---

## 👨‍💻 Équipe & Répartition

<table>
<tr>
<th colspan="2" align="center">🎨 Frontend</th>
</tr>
<tr>
<td align="center"><strong>Belkacemi CIRINE</strong></td>
<td>
• Maquette & conception visuelle<br>
• Login · Navbar · Navigation planning<br>
• Interface enseignant & étudiant<br>
• Intégration logique & interactions utilisateur
</td>
</tr>
<tr>
<td align="center"><strong>Lina EL HATHOUT</strong></td>
<td>
• Mise en place de la structure frontend<br>
• Dashboard administrateur<br>
• Gestion des réservations, utilisateurs, salles, conflits
</td>
</tr>
<tr>
<th colspan="2" align="center">🔧 Backend & Logique</th>
</tr>
<tr>
<td align="center"><strong>Adjaz RYMA</strong></td>
<td>
• API REST complète (CRUD : salles, cours, cohortes, conflits, matières, notifications, disponibilités, dashboard, équipements, historiques)<br>
• Gestion du planning (étudiant / enseignant / admin)<br>
• Gestion des conflits & réservations
</td>
</tr>
<tr>
<td align="center"><strong>Youssef EDRIS</strong></td>
<td>
• Authentification & Sécurité (JWT)<br>
• Détection des conflits<br>
• Base de données & schéma<br>
• Gestion des conflits & réservations<br>
• Génération automatique EDT
</td>
</tr>
</table>

---

## 📦 Livrables

- [x] 💻 Code source
- [x] 📓 Journal Git
- [x] 📄 Documentation
- [x] 🎬 Démo
- [x] 🎤 Présentation soutenance

---

<div align="center">

**Projet universitaire MIAGE 2026**

![GitHub](https://img.shields.io/badge/GitHub-Edris--Y%2Fmiage--planning--app-181717?style=for-the-badge&logo=github&logoColor=white)

*Lina EL HATHOUT · Youssef EDRIS · Belkacemi CIRINE · Adjaz RYMA*

</div>
