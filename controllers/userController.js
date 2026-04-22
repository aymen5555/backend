const db =require("../Database") ;
exports.getUsers = async (req,res) => { 
    try {
    const role = req.user.role ; 
    if (role !== 'admin') { 
        return res.status(403).json({message:"forbidden"}) ; 
    }  

    const query = 'SELECT id,created_at,name,email,role,cin,plan FROM users' ; 
    db.query(query, (err, result) => { 
        if (err) { 
            return res.status(500).json({message:"error"}) ; 
        } 
        res.json(result.rows) ; 
    }) ;  
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }

}