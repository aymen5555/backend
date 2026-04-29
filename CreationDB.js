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
      reste_code VARCHAR(10),
      expiration TIMESTAMPTZ,
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS patient_vitals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      measure_date DATE NOT NULL DEFAULT CURRENT_DATE,
      bpm INTEGER NOT NULL,
      sys INTEGER NOT NULL,
      dia INTEGER NOT NULL,
      temp NUMERIC(4,1) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS patient_biometrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      measure_date DATE NOT NULL DEFAULT CURRENT_DATE,
      poids NUMERIC(5,2) NOT NULL,
      imc NUMERIC(4,1) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS patient_activity (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      measure_date DATE NOT NULL DEFAULT CURRENT_DATE,
      pas INTEGER NOT NULL,
      dist NUMERIC(6,2) NOT NULL,
      cal INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS patient_nutrition (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      measure_date DATE NOT NULL DEFAULT CURRENT_DATE,
      cal INTEGER NOT NULL,
      qualite VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS patient_pathology (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      measure_date DATE NOT NULL DEFAULT CURRENT_DATE,
      glycemie NUMERIC(4,1) NOT NULL,
      spo2 INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS patient_goals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(60) NOT NULL,
      cible NUMERIC(10,2) NOT NULL,
      actuel NUMERIC(10,2) NOT NULL DEFAULT 0,
      unite VARCHAR(20),
      periode VARCHAR(20) NOT NULL,
      icon TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS medecin_prescriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      medecin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      medicine VARCHAR(120) NOT NULL,
      dosage VARCHAR(80),
      duration VARCHAR(80),
      notes TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS medecin_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      medecin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(120) NOT NULL,
      body TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'sent',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS medecin_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      medecin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      patient_id UUID REFERENCES users(id) ON DELETE SET NULL,
      period VARCHAR(30) NOT NULL,
      focus VARCHAR(60) NOT NULL,
      summary TEXT,
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