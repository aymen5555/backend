const jwt = require ("jsonwebtoken"); 
 

exports.verifToken= async(req,res,next) => { 
const header = req.headers.authorization ; 
if (!header) { 
   return res.status(403).json({message:"error"}) ; 
}  
const token = header.split(' ')[1] ; 
try { 
    const verified = jwt.verify (token, process.env.JWT_SECRET) ;            
     req.user = verified ;
    
    next() ; 
} catch (error) {
    return res.status(403).json({message:"error"}) ;
}




}