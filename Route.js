const express = require('express'); 
const router = express.Router(); 
const authController = require('./controllers/authController');
const authMiddleware = require('./middleware/middleware').verifToken;
const ChangeController = require('./controllers/Change_controller');
const createpatientController = require('./controllers/PatientCon');
const Changepassword = require ('./controllers/forgotpassword') ;
const patientData = require('./controllers/patientDataController');
const medecinData = require('./controllers/medecinDataController');

router.post('/register-patient', createpatientController.registerPatient);
router.post('/login', authController.login);
router.post('/change-password', authMiddleware, ChangeController.changePassword);
router.post('/forgot-password', Changepassword.forgotPassword);
router.post('/verify-code', Changepassword.verifyCode);
router.get('/medecin', authMiddleware, require('./controllers/getmedecin').getmedecin);
router.get('/users', authMiddleware, require('./controllers/userget').getUser);
router.get('/users/stats', authMiddleware, require('./controllers/userget').getUserStats);

router.get('/patient/vitals', authMiddleware, patientData.getVitals);
router.post('/patient/vitals', authMiddleware, patientData.addVital);
router.get('/patient/profile', authMiddleware, patientData.getProfile);
router.get('/patient/biometrics', authMiddleware, patientData.getBiometrics);
router.post('/patient/biometrics', authMiddleware, patientData.addBiometric);
router.get('/patient/activity', authMiddleware, patientData.getActivity);
router.post('/patient/activity', authMiddleware, patientData.addActivity);
router.get('/patient/nutrition', authMiddleware, patientData.getNutrition);
router.post('/patient/nutrition', authMiddleware, patientData.addNutrition);
router.get('/patient/pathology', authMiddleware, patientData.getPathology);
router.post('/patient/pathology', authMiddleware, patientData.addPathology);
router.get('/patient/goals', authMiddleware, patientData.getGoals);
router.post('/patient/goals', authMiddleware, patientData.addGoal);
router.put('/patient/goals/:id', authMiddleware, patientData.updateGoal);
router.delete('/patient/goals/:id', authMiddleware, patientData.deleteGoal);
router.get('/patient/messages', authMiddleware, patientData.getMessages);
router.post('/patient/messages', authMiddleware, patientData.addMessage);

router.get('/medecin/patients', authMiddleware, medecinData.getPatients);
router.get('/medecin/patients/:id/overview', authMiddleware, medecinData.getPatientOverview);
router.get('/medecin/prescriptions', authMiddleware, medecinData.getPrescriptions);
router.post('/medecin/prescriptions', authMiddleware, medecinData.addPrescription);
router.get('/medecin/messages', authMiddleware, medecinData.getMessages);
router.post('/medecin/messages', authMiddleware, medecinData.addMessage);
router.get('/medecin/reports', authMiddleware, medecinData.getReports);
router.post('/medecin/reports', authMiddleware, medecinData.addReport);

module.exports = router;

