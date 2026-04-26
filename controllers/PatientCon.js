const db = require("../Database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

exports.registerPatient = async (req, res) => {
  const client = await db.connect();

  try {
    const {nom, prenom, date_naissance, maladie_chronique, email, password } = req.body;

    if (!nom || !prenom || !email || !password || !date_naissance) {
      return res.status(400).json({ error: "Missing fields" });
    }


    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT 1 FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

   const result1 =  await client.query(
      `INSERT INTO users ( nom, prenom, email, password, role)
       VALUES ($1,$2,$3,$4,'patient')
       RETURNING id`,
      [ nom, prenom, email, hashed]
    );

const res2 =    await client.query(
      `INSERT INTO patients (utilisateur_id, date_naissance)
       VALUES ($1,$2)`,
    [result1.rows[0].id, date_naissance]
    );

    await client.query("COMMIT");


    res.status(201).json({ message: "Registered." });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};