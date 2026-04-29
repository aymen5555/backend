const db = require('../Database');

const getUserId = (req) => req.user && req.user.userId;
const getRole = (req) => req.user && req.user.role;

const requireRole = (req, res, role) => {
  if (getRole(req) !== role) {
    res.status(403).json({ message: 'forbidden' });
    return false;
  }

  return true;
};

exports.searchMedecins = async (req, res) => {
  if (!requireRole(req, res, 'patient')) return;

  try {
    const q = (req.query.q || '').trim();
    const specialite = (req.query.specialite || '').trim();
    const params = [];
    const clauses = ["u.role = 'medecin'"];

    if (q) {
      params.push(`%${q}%`);
      clauses.push(`(
        u.nom ILIKE $${params.length}
        OR u.prenom ILIKE $${params.length}
        OR u.email ILIKE $${params.length}
        OR COALESCE(m.specialite, '') ILIKE $${params.length}
        OR COALESCE(m.cabinet, '') ILIKE $${params.length}
      )`);
    }

    if (specialite && specialite !== 'Toutes') {
      params.push(specialite);
      clauses.push(`COALESCE(m.specialite, '') = $${params.length}`);
    }

    const result = await db.query(
      `SELECT u.id,
              u.nom,
              u.prenom,
              u.email,
              u.telephone,
              m.specialite,
              m.cabinet
       FROM users u
       LEFT JOIN medecins m ON m.utilisateur_id = u.id
       WHERE ${clauses.join(' AND ')}
       ORDER BY u.nom ASC, u.prenom ASC
       LIMIT 20`,
      params
    );

    res.json({ medecins: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMyInvitations = async (req, res) => {
  if (!requireRole(req, res, 'patient')) return;

  try {
    const patientId = getUserId(req);
    const result = await db.query(
      `SELECT i.id,
              i.message,
              i.statut,
              i.created_at,
              i.updated_at,
              u.nom AS medecin_nom,
              u.prenom AS medecin_prenom,
              u.email AS medecin_email,
              u.telephone AS medecin_telephone,
              m.specialite,
              m.cabinet
       FROM invitations i
       JOIN users u ON u.id = i.medecin_id
       LEFT JOIN medecins m ON m.utilisateur_id = i.medecin_id
       WHERE i.patient_id = $1
       ORDER BY i.created_at DESC`,
      [patientId]
    );

    res.json({ invitations: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createInvitation = async (req, res) => {
  if (!requireRole(req, res, 'patient')) return;

  try {
    const patientId = getUserId(req);
    const { medecinId, message } = req.body;

    if (!medecinId) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const medecinResult = await db.query(
      "SELECT id, nom, prenom FROM users WHERE id = $1 AND role = 'medecin'",
      [medecinId]
    );

    if (medecinResult.rows.length === 0) {
      return res.status(404).json({ message: 'Medecin not found' });
    }

    const duplicate = await db.query(
      `SELECT id
       FROM invitations
       WHERE patient_id = $1 AND medecin_id = $2 AND statut = 'pending'`,
      [patientId, medecinId]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({ message: 'Une invitation est deja en attente pour ce medecin' });
    }

    const result = await db.query(
      `INSERT INTO invitations (patient_id, medecin_id, message)
       VALUES ($1, $2, $3)
       RETURNING id, message, statut, created_at, updated_at`,
      [patientId, medecinId, message || null]
    );

    res.status(201).json({
      ...result.rows[0],
      medecin: medecinResult.rows[0],
      message: 'Invitation envoyée avec succès',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.cancelInvitation = async (req, res) => {
  if (!requireRole(req, res, 'patient')) return;

  try {
    const patientId = getUserId(req);
    const { id } = req.params;

    const result = await db.query(
      `UPDATE invitations
       SET statut = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND patient_id = $2 AND statut = 'pending'
       RETURNING id`,
      [id, patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    res.json({ message: 'Invitation annulée' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.getMedecinInvitations = async (req, res) => {
  if (!requireRole(req, res, 'medecin')) return;
  const medecinId = getUserId(req);

  try {
    const result = await db.query(
      `SELECT i.id,
              i.message,
              i.statut,
              i.created_at,
              i.updated_at,
              u.nom AS patient_nom,
              u.prenom AS patient_prenom,
              u.email AS patient_email,
              u.telephone AS patient_telephone
       FROM invitations i
       JOIN users u ON u.id = i.patient_id
       WHERE i.medecin_id = $1
       ORDER BY i.created_at DESC`,
      [medecinId]
    );

    res.json({ invitations: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 
exports.acceptInvitation = async (req, res) => {
  if (!requireRole(req, res, 'medecin')) return;
    const medecinId = getUserId(req);
    const { id } = req.params;
    try {
        const result = await db.query(
            `UPDATE invitations
                SET statut = 'accepted', updated_at = NOW()
                WHERE id = $1 AND medecin_id = $2 AND statut = 'pending'
                RETURNING id, patient_id`,
            [id, medecinId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Invitation non trouvée' });
        }
        const patientId = result.rows[0].patient_id;
        await db.query(
          `INSERT INTO medecin_patients (medecin_id, patient_id)
           VALUES ($1, $2)
           ON CONFLICT (medecin_id, patient_id) DO NOTHING`,
          [medecinId, patientId]
        );

        res.json({ message: 'Invitation acceptée' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.refuseInvitation = async (req, res) => {
  if (!requireRole(req, res, 'medecin')) return;
    const medecinId = getUserId(req);
    const { id } = req.params;
    try {
        const result = await db.query(
            `UPDATE invitations
                SET statut = 'refused',
                    updated_at = NOW()
                WHERE id = $1 AND medecin_id = $2 AND statut = 'pending'
                RETURNING id`,
            [id, medecinId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Invitation non trouvée' });
        }
        res.json({ message: 'Invitation refusée' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};