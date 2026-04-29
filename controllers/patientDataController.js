const db = require("../Database");

const getUserId = (req) => req.user && req.user.userId;

const coerceDate = (date) => {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.valueOf())) return null;
  return parsed.toISOString().slice(0, 10);
};

exports.getVitals = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await db.query(
      "SELECT id, measure_date, bpm, sys, dia, temp FROM patient_vitals WHERE patient_id = $1 ORDER BY measure_date ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addVital = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { bpm, sys, dia, temp, date } = req.body;

    if (!bpm || !sys || !dia || !temp) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const measureDate = coerceDate(date) || new Date().toISOString().slice(0, 10);
    const result = await db.query(
      `INSERT INTO patient_vitals (patient_id, measure_date, bpm, sys, dia, temp)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, measure_date, bpm, sys, dia, temp`,
      [userId, measureDate, bpm, sys, dia, temp]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getBiometrics = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await db.query(
      "SELECT id, measure_date, poids, imc FROM patient_biometrics WHERE patient_id = $1 ORDER BY measure_date ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addBiometric = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { poids, imc, date } = req.body;

    if (!poids || !imc) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const measureDate = coerceDate(date) || new Date().toISOString().slice(0, 10);
    const result = await db.query(
      `INSERT INTO patient_biometrics (patient_id, measure_date, poids, imc)
       VALUES ($1, $2, $3, $4)
       RETURNING id, measure_date, poids, imc`,
      [userId, measureDate, poids, imc]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getActivity = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await db.query(
      "SELECT id, measure_date, pas, dist, cal FROM patient_activity WHERE patient_id = $1 ORDER BY measure_date ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addActivity = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { pas, dist, cal, date } = req.body;

    if (!pas && pas !== 0) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const measureDate = coerceDate(date) || new Date().toISOString().slice(0, 10);
    const result = await db.query(
      `INSERT INTO patient_activity (patient_id, measure_date, pas, dist, cal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, measure_date, pas, dist, cal`,
      [userId, measureDate, pas, dist || 0, cal || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getNutrition = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await db.query(
      "SELECT id, measure_date, cal, qualite FROM patient_nutrition WHERE patient_id = $1 ORDER BY measure_date ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addNutrition = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { cal, qualite, date } = req.body;

    if (!cal || !qualite) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const measureDate = coerceDate(date) || new Date().toISOString().slice(0, 10);
    const result = await db.query(
      `INSERT INTO patient_nutrition (patient_id, measure_date, cal, qualite)
       VALUES ($1, $2, $3, $4)
       RETURNING id, measure_date, cal, qualite`,
      [userId, measureDate, cal, qualite]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPathology = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await db.query(
      "SELECT id, measure_date, glycemie, spo2 FROM patient_pathology WHERE patient_id = $1 ORDER BY measure_date ASC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addPathology = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { glycemie, spo2, date } = req.body;

    if (!glycemie || !spo2) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const measureDate = coerceDate(date) || new Date().toISOString().slice(0, 10);
    const result = await db.query(
      `INSERT INTO patient_pathology (patient_id, measure_date, glycemie, spo2)
       VALUES ($1, $2, $3, $4)
       RETURNING id, measure_date, glycemie, spo2`,
      [userId, measureDate, glycemie, spo2]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getGoals = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await db.query(
      "SELECT id, type, cible, actuel, unite, periode, icon FROM patient_goals WHERE patient_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addGoal = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { type, cible, actuel, unite, periode, icon } = req.body;

    if (!type || !cible || !periode) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await db.query(
      `INSERT INTO patient_goals (patient_id, type, cible, actuel, unite, periode, icon)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, type, cible, actuel, unite, periode, icon`,
      [userId, type, cible, actuel || 0, unite || null, periode, icon || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { type, cible, actuel, unite, periode, icon } = req.body;

    const result = await db.query(
      `UPDATE patient_goals
       SET type = $1, cible = $2, actuel = $3, unite = $4, periode = $5, icon = $6
       WHERE id = $7 AND patient_id = $8
       RETURNING id, type, cible, actuel, unite, periode, icon`,
      [type, cible, actuel || 0, unite || null, periode, icon || null, id, userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM patient_goals WHERE id = $1 AND patient_id = $2 RETURNING id",
      [id, userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await db.query(
      `SELECT m.id,
              m.subject,
              m.body,
              m.status,
              m.created_at,
              u.nom || ' ' || u.prenom AS medecin_label
       FROM medecin_messages m
       JOIN users u ON u.id = m.medecin_id
       WHERE m.patient_id = $1
       ORDER BY m.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const medecinResult = await db.query(
      "SELECT medecin_id FROM patients WHERE utilisateur_id = $1",
      [userId]
    );

    const medecinId = medecinResult.rows[0] && medecinResult.rows[0].medecin_id;
    if (!medecinId) {
      return res.status(400).json({ message: "Aucun medecin attribue" });
    }

    const result = await db.query(
      `INSERT INTO medecin_messages (medecin_id, patient_id, subject, body, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, subject, body, status, created_at`,
      [medecinId, userId, subject, body, "patient"]
    );

    const medecinLabel = await db.query(
      "SELECT nom, prenom FROM users WHERE id = $1",
      [medecinId]
    );
    const label = medecinLabel.rows[0] ? `${medecinLabel.rows[0].nom} ${medecinLabel.rows[0].prenom}` : null;

    res.status(201).json({ ...result.rows[0], medecin_label: label });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await db.query(
      `SELECT u.id,
              u.nom,
              u.prenom,
              u.email,
              u.telephone,
              p.date_naissance,
              p.adresse,
              p.medecin_id,
              d.nom AS medecin_nom,
              d.prenom AS medecin_prenom,
              d.email AS medecin_email,
              m.specialite AS medecin_specialite
       FROM users u
       JOIN patients p ON p.utilisateur_id = u.id
       LEFT JOIN users d ON d.id = p.medecin_id
       LEFT JOIN medecins m ON m.utilisateur_id = p.medecin_id
       WHERE u.id = $1`,
      [userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
