const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 
const database = require('../Database'); 

exports.login = async (req, res) => { 
    const {email, password} = req.body;
    
    
    try {
        const user = await database.query('SELECT * FROM users where email = $1', [email]);
        
    
        
        if (!user.rows || user.rows.length === 0) { 
            return res.status(404).json({ message: 'User not found' }); 
        } 
        
        const userData = user.rows[0];
        const isPasswordValid = await bcrypt.compare(password, userData.password); 
        
        if (!isPasswordValid) { 
            return res.status(401).json({ message: 'Invalid password' }); 
        } 
        
        const token = jwt.sign({ userId: userData.id }, 'your_jwt_secret', { expiresIn: '1h' }); 
        res.json({ token, role: userData.role });
        
    } catch (error) {
       
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}