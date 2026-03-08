
const express = require('express');
const cors = require('cors');
const app = express();
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const { getDbConnection } = require('./db/database.js');
require('dotenv').config();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API Gestion Planning - MIAGE en ligne');
});
app.get('/data', (req, res) => {
  res.send('DATA OK - ' + new Date().toISOString());
});

app.get('/users', (req, res) => {
  res.send('Voici les données de USERS');
});
app.listen(port, async () => {
  console.log(`Serveur lancé sur le port ${port}`);

  try {
    const db = await getDbConnection();
    const users = await db.all('SELECT nom,mot_de_passe FROM Utilisateur');
    
    console.log('\n--- DONNÉES DE LA TABLE UTILISATEUR ---');
    console.log(users);
    console.log('---------------------------------------\n');
  } catch (error) {
    console.error("Erreur SQL au démarrage :", error.message);
  }
});