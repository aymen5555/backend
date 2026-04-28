const express = require('express'); 
const router = express.Router(); 
const authController = require('./controllers/authController');
const authMiddleware = require('./middleware/middleware').verifToken;
const ChangeController = require('./controllers/Change_controller');
const createpatientController = require('./controllers/PatientCon');
const Changepassword = require ('./controllers/forgotpassword') ;

router.post('/register-patient', createpatientController.registerPatient);
router.post('/login', authController.login);
router.post('/change-password', authMiddleware, ChangeController.changePassword);
router.post('/forgot-password', Changepassword.forgotPassword);
router.post('/verify-code', Changepassword.verifyCode);
router.get('/medecin', authMiddleware, require('./controllers/getmedecin').getmedecin);
router.get('/users', authMiddleware, require('./controllers/userget').getUser);
router.get('/users/stats', authMiddleware, require('./controllers/userget').getUserStats);

module.exports = router;

