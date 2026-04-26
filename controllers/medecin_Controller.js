const bcrypt = require('bcrypt');
const crypto = require('crypto');
const database = require('../Database');
const nodemailer = require('nodemailer');
const SALT_ROUNDS = 10;

function generatePassword(length = 10) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─────────────────────────────────────────────
// 🎯 CREATE MEDECIN
// ─────────────────────────────────────────────
exports.createMedecin = async (req, res) => {
  console.log("🔥 CREATE MEDECIN CALLED");
  console.log("BODY:", req.body);
  const { nom, prenom, email, specialite, telephone, cabinet } = req.body;

  // ✅ Validation simple (sans fonction externe)
  if (!nom || !prenom || !email || !specialite) {
    return res.status(400).json({
      success: false,
      message: "Champs obligatoires manquants"
    });
  }

  const client = await database.connect();
  console.log("🟢 DB CONNECTED");   // 👈 ICI

  try {
    await client.query('BEGIN');

    // 🔍 Vérifier email existant
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: "Email déjà utilisé"
      });
    }

    // 🔑 Générer mot de passe
    const temporaryPassword = generatePassword(10);

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

    // 💾 Insert dans DB
    const result = await client.query(
      `INSERT INTO users 
      (nom, prenom, email, password, role,  telephone)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id, nom, prenom, email`,
      [
        nom.trim(),
        prenom.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        'medecin',
        telephone || null,
       
      ]
    ); 
    const result2= await client.query(
      `INSERT INTO medecins (utilisateur_id, specialite, cabinet)
       VALUES ($1, $2, $3)`,
      [result.rows[0].id, specialite, cabinet || null]
    );

    const newMedecin = result.rows[0]; 

    await client.query('COMMIT');


    await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Votre compte médecin sur notre plateforme',
    text: `Bonjour ${nom},

    Votre compte a été créé.

    Email: ${email}
    Mot de passe: ${temporaryPassword}

    Merci de modifier votre mot de passe dés votre premiere connexion .`
  });



  
    // ✅ Réponse
    return res.status(201).json({
      success: true,
      message: "Médecin créé avec succès",
      medecin: newMedecin
    });
  
  }catch (error) {
  console.error("🔥 FULL ERROR:", error);

  return res.status(500).json({
    success: false,
    message: error.message,
    detail: error.detail,
    code: error.code
  });
}finally {
    client.release();
  }
};