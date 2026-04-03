const express = require('express'); 
const router = express.Router(); 
const database = require('./Database');  
router.get('/users', require('./midleware/middleware').verifToken, require('./controllers/userget').getUser) ;
module.exports = router;