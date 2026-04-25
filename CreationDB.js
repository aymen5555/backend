require("dotenv").config();

const {Pool} = require ("pg") ; 
const bcrypt = require('bcrypt');
const pool=new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port:  5432,
});
// fonction pour insérer un utilisateur
async function createTables() {
  const res1=  await pool.query(`
    CREATE TABLE users (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nom         VARCHAR(100)  NOT NULL,
      prenom      VARCHAR(100)  NOT NULL,
      email       VARCHAR(255)  NOT NULL UNIQUE,
      password    TEXT          NOT NULL,
  role        VARCHAR(20)   NOT NULL CHECK (role IN ('admin','medecin','patient')),
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()`
);

const res2 = await pool.query(`
  CREATE TABLE medecins (
    utilisateur_id  UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    specialite      VARCHAR(100),
    telephone       VARCHAR(30),
    rpps            VARCHAR(20) UNIQUE,
    cabinet         VARCHAR(200),
  first_login     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()`
);

const res3 = await pool.query(`
  CREATE TABLE patients (
    utilisateur_id  UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    date_naissance  DATE,
    sexe CHAR(1) CHECK (sexe IN ('M','F','A')),
    telephone  VARCHAR(30),
    adresse  TEXT,
  medecin_id  UUID REFERENCES medecins(utilisateur_id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()`
);
}
async function addUser(cin, name, email, password,role) {
  const hashedPassword = await bcrypt.hash(password, 10); // hash
  const result = await pool.query(
    `INSERT INTO users (cin, name, email, password,role) 
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [cin, name, email, hashedPassword, role]
  );
  console.log("Utilisateur ajouté :", result.rows[0]);
}

// fonction pour tester login
async function loginUser(email, inputPassword) {
  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if(result.rows.length === 0) return console.log("Utilisateur non trouvé");

  const user = result.rows[0];
  const match = await bcrypt.compare(inputPassword, user.password);

  if(match) {
    console.log("Login réussi ✅", user);
  } else {
    console.log("Mot de passe incorrect ❌");
  }
}

// tester
(async () => { 
  await createTables(); 
  await addUser("11210426", "fedo", "fedij565@gmail.com", "fedi12345s","admin"); // insert
  await loginUser("fedij565@gmail.com", "fedi12345s"); // login correct
  await loginUser("fedij565@gmail.com", "wrongpass"); // login faux
  pool.end(); // fermer connexion
})();