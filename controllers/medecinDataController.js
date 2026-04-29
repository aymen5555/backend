const db = require("../Database");

const getUserId = (req) => req.user && req.user.userId;
const getRole = (req) => req.user && req.user.role;

const forbidIfNotMedecin = (req, res) => {
  if (getRole(req) !== "medecin") {
    res.status(403).json({ message: "forbidden" });
    return true;
  }
  return false;
};

exports.getPatients = async (req, res) => {
  if (forbidIfNotMedecin(req, res)) return;
  try {
    const medecinId = getUserId(req);
    const result = await db.query(
      `SELECT p.utilisateur_id AS id,
              u.nom,
              u.prenom,
              u.email,
              p.telephone,
              p.date_naissance,
              COALESCE(date_part('year', age(p.date_naissance))::int, NULL) AS age,
              (SELECT measure_date FROM patient_vitals v WHERE v.patient_id = p.utilisateur_id ORDER BY measure_date DESC LIMIT 1) AS last_visit,
              (SELECT bpm FROM patient_vitals v WHERE v.patient_id = p.utilisateur_id ORDER BY measure_date DESC LIMIT 1) AS last_bpm,
              (SELECT glycemie FROM patient_pathology x WHERE x.patient_id = p.utilisateur_id ORDER BY measure_date DESC LIMIT 1) AS last_glycemie
       FROM patients p
       JOIN users u ON u.id = p.utilisateur_id
       WHERE p.medecin_id = $1
       ORDER BY u.nom ASC, u.prenom ASC`,
      [medecinId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPatientOverview = async (req, res) => {
  if (forbidIfNotMedecin(req, res)) return;
  try {
    const medecinId = getUserId(req);
    const { id } = req.params;

    const patientResult = await db.query(
      `SELECT p.utilisateur_id AS id,
              u.nom,
              u.prenom,
              u.email,
              p.telephone,
              p.date_naissance,
              COALESCE(date_part('year', age(p.date_naissance))::int, NULL) AS age
       FROM patients p
       JOIN users u ON u.id = p.utilisateur_id
       WHERE p.utilisateur_id = $1 AND p.medecin_id = $2`,
      [id, medecinId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const vitals = await db.query(
      "SELECT measure_date, bpm, sys, dia, temp FROM patient_vitals WHERE patient_id = $1 ORDER BY measure_date DESC LIMIT 1",
      [id]
    );
    const biometrics = await db.query(
      "SELECT measure_date, poids, imc FROM patient_biometrics WHERE patient_id = $1 ORDER BY measure_date DESC LIMIT 1",
      [id]
    );
    const pathology = await db.query(
      "SELECT measure_date, glycemie, spo2 FROM patient_pathology WHERE patient_id = $1 ORDER BY measure_date DESC LIMIT 1",
      [id]
    );

    res.json({
      patient: patientResult.rows[0],
      vitals: vitals.rows[0] || null,
      biometrics: biometrics.rows[0] || null,
      pathology: pathology.rows[0] || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPrescriptions = async (req, res) => {
  if (forbidIfNotMedecin(req, res)) return;
  try {
    const medecinId = getUserId(req);
    const { patientId } = req.query;
    const params = [medecinId];
    let where = "WHERE p.medecin_id = $1";

    if (patientId) {
      params.push(patientId);
      where += " AND p.patient_id = $2";
    }

    const result = await db.query(
      `SELECT p.id,
              p.medicine,
              p.dosage,
              p.duration,
              p.notes,
              p.status,
              p.created_at,
              u.nom || ' ' || u.prenom AS patient_label
       FROM medecin_prescriptions p
       JOIN users u ON u.id = p.patient_id
       ${where}
       ORDER BY p.created_at DESC`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addPrescription = async (req, res) => {
  if (forbidIfNotMedecin(req, res)) return;
  try {
    const medecinId = getUserId(req);
    const { patientId, medicine, dosage, duration, notes } = req.body;

    if (!patientId || !medicine) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await db.query(
      `INSERT INTO medecin_prescriptions (medecin_id, patient_id, medicine, dosage, duration, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, medicine, dosage, duration, notes, status, created_at`,
      [medecinId, patientId, medicine, dosage || null, duration || null, notes || null]
    );

    const patientLabel = await db.query("SELECT nom, prenom FROM users WHERE id = $1", [patientId]);
    const label = patientLabel.rows[0] ? `${patientLabel.rows[0].nom} ${patientLabel.rows[0].prenom}` : null;

    res.status(201).json({ ...result.rows[0], patient_label: label });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  if (forbidIfNotMedecin(req, res)) return;
  try {
    const medecinId = getUserId(req);
    const result = await db.query(
      `SELECT m.id,
              m.subject,
              m.body,
              m.status,
              m.created_at,
              u.nom || ' ' || u.prenom AS patient_label
       FROM medecin_messages m
       JOIN users u ON u.id = m.patient_id
       WHERE m.medecin_id = $1
       ORDER BY m.created_at DESC`,
      [medecinId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addMessage = async (req, res) => {
  if (forbidIfNotMedecin(req, res)) return;
  try {
    const medecinId = getUserId(req);
    const { patientId, subject, body } = req.body;

    if (!patientId || !subject || !body) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await db.query(
      `INSERT INTO medecin_messages (medecin_id, patient_id, subject, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, subject, body, status, created_at`,
      [medecinId, patientId, subject, body]
    );

    const patientLabel = await db.query("SELECT nom, prenom FROM users WHERE id = $1", [patientId]);
    const label = patientLabel.rows[0] ? `${patientLabel.rows[0].nom} ${patientLabel.rows[0].prenom}` : null;

    res.status(201).json({ ...result.rows[0], patient_label: label });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getReports = async (req, res) => {
  if (forbidIfNotMedecin(req, res)) return;
  try {
    const medecinId = getUserId(req);
    const result = await db.query(
      `SELECT r.id,
              r.period,
              r.focus,
              r.summary,
              r.created_at
       FROM medecin_reports r
       WHERE r.medecin_id = $1
       ORDER BY r.created_at DESC`,
      [medecinId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addReport = async (req, res) => {
  if (forbidIfNotMedecin(req, res)) return;
  try {
    const medecinId = getUserId(req);
    const { patientId, period, focus, summary } = req.body;

    if (!period || !focus) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await db.query(
      `INSERT INTO medecin_reports (medecin_id, patient_id, period, focus, summary)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, period, focus, summary, created_at`,
      [medecinId, patientId || null, period, focus, summary || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
