const express = require('express'); 
const router = express.Router(); 
const authController = require('./controllers/authController');
const authMiddleware = require('./middleware/middleware').verifToken;

// 🔓 login
router.post('/login', authController.login);

// 🔒 users protégés
router.get('/users', authMiddleware, require('./controllers/userget').getUser);

module.exports = router;

