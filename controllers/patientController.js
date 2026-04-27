const db = require("../Database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../services/emailservice");

exports.registerPatient = async (req, res) => {
  const client = await db.connect();

  try {
    const { cin, nom, prenom, date_naissance, maladie_chronique, email, password } = req.body;

    if (!cin || !nom || !prenom || !email || !password || !date_naissance) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT 1 FROM users WHERE cin=$1 OR email=$2",
      [cin, email]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const userResult = await client.query(
    `INSERT INTO users (cin, nom, prenom, email, mot_de_passe, role, status, verification_token, is_verified)
    VALUES ($1,$2,$3,$4,$5,'patient','inactive',$6,false)
    RETURNING id`,
    [cin, nom, prenom, email, hashed, token]
  );

    const userId = userResult.rows[0].id;

    await client.query(
      `INSERT INTO patients (cin, date_naissance, maladie_chronique, user_id)
      VALUES ($1,$2,$3,$4)`,
      [cin, date_naissance, maladie_chronique || null, userId]
    );

    await client.query("COMMIT");

    await sendVerificationEmail(email, token);

    res.status(201).json({ message: "Registered. Check email." });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};