require("dotenv").config();

const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

async function createTables() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nom VARCHAR(100) NOT NULL,
      prenom VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'medecin', 'patient')),
      telephone VARCHAR(20),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      lastlog TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS medecins (
      utilisateur_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      specialite VARCHAR(100),
      telephone VARCHAR(30),
      rpps VARCHAR(20) UNIQUE,
      cabinet VARCHAR(200),
      first_login BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS patients (
      utilisateur_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      date_naissance DATE,
      sexe CHAR(1) CHECK (sexe IN ('M', 'F', 'A')),
      telephone VARCHAR(30),
      adresse TEXT,
      medecin_id UUID REFERENCES medecins(utilisateur_id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function addUser(nom, prenom, email, password, role, telephone = null) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (nom, prenom, email, password, role, telephone)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [nom, prenom, email, hashedPassword, role, telephone]
  );
  console.log("Utilisateur ajouté :", result.rows[0]);
  return result.rows[0];
}

async function loginUser(email, inputPassword) {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    console.log("Utilisateur non trouvé");
    return null;
  }

  const user = result.rows[0];
  const match = await bcrypt.compare(inputPassword, user.password);

  if (match) {
    console.log("Login réussi ✅", user);
    return user;
  }

  console.log("Mot de passe incorrect ❌");
  return null;
}

async function main() {
  try {
    await createTables();
    await addUser("fedo", "jerbu", "fedij565@gmail.com", "fedi12345s", "admin", "11210426");
    await loginUser("fedij565@gmail.com", "fedi12345s");
    await loginUser("fedij565@gmail.com", "wrongpass");
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Erreur:", error);
    process.exit(1);
  });
}