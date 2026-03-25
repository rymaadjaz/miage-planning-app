<<<<<<< HEAD
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Gestion Planning - MIAGE en ligne');
});

app.listen(port, () => {
  console.log(`Serveur lancé sur le port ${port}`);
=======

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { getDbConnection } = require("./db/database.js");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/userRoutes");
const cohortesRoutes = require("./routes/cohortesRoutes");
const sallesRoutes = require("./routes/sallesRoutes");
const seancesRoutes = require("./routes/seancesRoutes");
const reservationsRoutes = require("./routes/reservationsRoutes");
const matieresRoutes = require("./routes/matieresRoutes");
const equipementsRoutes = require("./routes/equipementsRoutes");
const conflitsRoutes = require("./routes/conflitsRoutes");
const historiquesRoutes = require("./routes/historiquesRoutes");
const disponibilitesRoutes = require("./routes/disponibilitesRoutes");
const planningRoutes = require("./routes/planningRoutes");
const etudiantsRoutes = require("./routes/etudiantsRoutes");
const enseignantsRoutes = require("./routes/enseignantsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API Gestion Planning - MIAGE en ligne" });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/cohortes", cohortesRoutes);
app.use("/api/salles", sallesRoutes);
app.use("/api/seances", seancesRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/matieres", matieresRoutes);
app.use("/api/equipements", equipementsRoutes);
app.use("/api/conflits", conflitsRoutes);
app.use("/api/historiques", historiquesRoutes);
app.use("/api/disponibilites", disponibilitesRoutes);
app.use("/api/planning", planningRoutes);
app.use("/api/etudiants", etudiantsRoutes);
app.use("/api/enseignants", enseignantsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/data", (req, res) => {
  res.send("DATA OK - " + new Date().toISOString());
});

app.use(notFound);
app.use(errorHandler);

app.listen(port, async () => {
  console.log(`Serveur lancé sur le port ${port}`);

  try {
    const db = await getDbConnection();

    const users = await db.all(`
      SELECT id, nom, prenom, email, role
      FROM Utilisateur
      ORDER BY id ASC
    `);

    console.log("\n--- DONNÉES DE LA TABLE UTILISATEUR ---");
    console.log(users);
    console.log("---------------------------------------\n");

    await db.close();
  } catch (error) {
    console.error("Erreur SQL au démarrage :", error.message);
  }
>>>>>>> adjaz-ryma
});