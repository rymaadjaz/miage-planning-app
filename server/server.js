const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Gestion Planning - MIAGE en ligne');
});

app.listen(port, () => {
  console.log(`Serveur lancé sur le port ${port}`);
});