const db =require("../Database") ;
exports.getUser = async (req,res) => { 
    try {
    const role = req.user.role ; 
    if (role !== 'admin') { 
        return res.status(403).json({message:"forbidden"}) ; 
    }  

    const query = 'SELECT id,created_at,nom,prenom,email,role,telephone,lastlog FROM users' ; 
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

exports.getUserStats = async (req, res) => {
    try {
        const role = req.user.role;
        if (role !== 'admin') {
            return res.status(403).json({ message: 'forbidden' });
        }

        const statsQuery = `
            SELECT
                COUNT(*)::int AS total_users,
                COUNT(*) FILTER (WHERE role = 'admin')::int AS total_admins,
                COUNT(*) FILTER (WHERE role = 'medecin')::int AS total_medecins,
                COUNT(*) FILTER (WHERE lastlog >= NOW() - INTERVAL '30 days')::int AS active_30_days,
                COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::int AS new_this_month
            FROM users
        `;

        const result = await db.query(statsQuery);
        return res.json(result.rows[0]);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}