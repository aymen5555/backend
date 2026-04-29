const express = require('express'); 
const router = express.Router(); 

const { createMedecin } = require('./controllers/medecin_Controller');
const invitationController = require('./controllers/invitationController');
const authMiddleware = require('./middleware/middleware').verifToken;

// 🔓 route publique
router.post('/create-medecin', createMedecin);

// 🔒 route protégée (exemple)
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: "Accès autorisé", user: req.user });
});

router.get('/medecins/search', authMiddleware, invitationController.searchMedecins);
router.get('/invitations/mes-invitations', authMiddleware, invitationController.getMyInvitations);
router.post('/invitations', authMiddleware, invitationController.createInvitation);
router.delete('/invitations/:id', authMiddleware, invitationController.cancelInvitation);
router.get('/invitations/medecin', authMiddleware, invitationController.getMedecinInvitations);
router.delete('/invitations/medecin/:id', authMiddleware, invitationController.refuseInvitation);
router.put('/invitations/medecin/:id', authMiddleware, invitationController.acceptInvitation);
module.exports = router;