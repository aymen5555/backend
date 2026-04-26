const express = require('express'); 
const router = express.Router(); 
const authController = require('./controllers/authController');
const authMiddleware = require('./middleware/middleware').verifToken;
const ChangeController = require('./controllers/Change_controller');
router.post('/login', authController.login);
router.post('/change-password', authMiddleware, ChangeController.changePassword);
router.get('/medecin', authMiddleware, require('./controllers/getmedecin').getmedecin);
router.get('/users', authMiddleware, require('./controllers/userget').getUser);

module.exports = router;

