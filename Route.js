const express = require('express'); 
const router = express.Router(); 
const database = require('./Database');  
const authController = require('./controllers/authController');
router.post('/login', authController.login);
module.exports = router;