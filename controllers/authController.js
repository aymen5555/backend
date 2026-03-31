const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 
const database = require('../Database'); 

exports.login = async (req, res) => { 
    const {cin, password} = req.body;
    
    
    try {
        const user = await database.query('SELECT * FROM users where cin = $1', [cin]);
        
        console.log("Database query result:", user); // Debug 2
        console.log("Number of rows found:", user.rows ? user.rows.length : 0); // Debug 3
        
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
        console.error("Login error:", error); // Debug 4
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}