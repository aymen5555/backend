const pool = require('../Database');

exports.getmedecin = async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = 'SELECT utilisateur_id, first_login FROM medecins WHERE utilisateur_id = $1';
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};