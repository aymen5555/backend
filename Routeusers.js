const express = require('express'); 
const router = express.Router(); 

const { createMedecin } = require('./controllers/medecin_Controller');
const authMiddleware = require('./middleware/middleware').verifToken;

// 🔓 route publique
router.post('/create-medecin', createMedecin);

// 🔒 route protégée (exemple)
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: "Accès autorisé", user: req.user });
});

module.exports = router;