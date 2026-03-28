require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { getDbConnection } = require("./db/database");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const cohortesRoutes = require("./routes/cohortesRoutes");
const conflitsRoutes = require("./routes/conflitsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const disponibilitesRoutes = require("./routes/disponibilitesRoutes");
const enseignantsRoutes = require("./routes/enseignantsRoutes");
const equipementsRoutes = require("./routes/equipementsRoutes");
const etudiantsRoutes = require("./routes/etudiantsRoutes");
const historiquesRoutes = require("./routes/historiquesRoutes");
const matieresRoutes = require("./routes/matieresRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const planningRoutes = require("./routes/planningRoutes");
const reservationsRoutes = require("./routes/reservationsRoutes");
const sallesRoutes = require("./routes/sallesRoutes");
const seancesRoutes = require("./routes/seancesRoutes");

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "API Gestion Planning - MIAGE en ligne",
  });
});

app.get("/health", async (_req, res, next) => {
  let db;

  try {
    db = await getDbConnection();
    await db.get("SELECT 1 AS ok");

    res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  } finally {
    if (db) {
      await db.close();
    }
  }
});

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cohortes", cohortesRoutes);
app.use("/api/conflits", conflitsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/disponibilites", disponibilitesRoutes);
app.use("/api/enseignants", enseignantsRoutes);
app.use("/api/equipements", equipementsRoutes);
app.use("/api/etudiants", etudiantsRoutes);
app.use("/api/historiques", historiquesRoutes);
app.use("/api/matieres", matieresRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/planning", planningRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/salles", sallesRoutes);
app.use("/api/seances", seancesRoutes);

// Middleware de fin
app.use(notFound);
app.use(errorHandler);

async function checkDatabaseConnection() {
  let db;

  try {
    db = await getDbConnection();
    await db.get("SELECT 1 AS ok");
    console.log("Base de données connectée.");
  } finally {
    if (db) {
      await db.close();
    }
  }
}

async function startServer() {
  try {
    await checkDatabaseConnection();

    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`Serveur lancé sur le port ${port}`);
    });

    server.on("error", (error) => {
      console.error("Erreur serveur :", error);
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} reçu, arrêt du serveur...`);
      server.close(() => {
        console.log("Serveur arrêté.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception :", error);
    });

    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled Rejection :", reason);
    });

    return server;
  } catch (error) {
    console.error("Impossible de démarrer le serveur :", error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;