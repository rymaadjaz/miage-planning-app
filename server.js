const express = require("express");
const app = express();
const port = 3000;

// Init DB (création tables)
require("./db/database");

// Routes
const sallesRoutes = require("./routes/salles");
const seancesRoutes = require("./routes/seances");
const cohortesRoutes = require("./routes/cohortes");
const reservationsRoutes = require("./routes/reservations");

// Middlewares
const { attachUser } = require("./middleware/authMiddleware");
const notFound = require("./middleware/notFoundMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");

app.use(express.json());

app.use(attachUser);

app.use("/api/salles", sallesRoutes);
app.use("/api/seances", seancesRoutes);
app.use("/api/cohortes", cohortesRoutes);
app.use("/api/reservations", reservationsRoutes);

// 404 + erreurs
app.use(notFound);
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});