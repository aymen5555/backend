const pool = require ('../Database') ; 
const nodemailer = require('nodemailer') ; 
const bcrypt = require('bcrypt') ;
require('dotenv').config() ;
exports.forgotPassword = async (req,res)=>  { 
   const  {email} = req.body  
   const query = 'select * from users where email=$1' ; 
  const response  = await pool.query (query,[email]) ; 
  if (response.rows.length===0) {
    return res.status(400).json({message:"utilisateur non trouvable "}) ; 
  } 
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  }); 
  function generateCode() {
  return Math.floor(100000 + Math.random() * 900000);
}
    const code = generateCode() ;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Code de verification pour reinitialisation de mot de passe',
      text: `Bonjour ${response.rows[0].nom},

Votre code de verification est : ${code}

Merci de votre confiance.`
    });
    const query = 'update users set reste_code = $1, expiration = $2 where email = $3';
    await pool.query(query, [String(code), new Date(Date.now() + 3600000), email]);
    return res.json({ message: 'code envoye' });
  } catch (error) {
    console.error("🔥 FULL ERROR:", error);
    return res.status(500).json({ message: 'erreur envoi email' });
  }



}
exports.verifyCode = async (req,res) => {
  const {email, code, newPassword} = req.body ; 
  const query = 'select * from users where email=$1' ; 
  const response = await pool.query(query, [email]) ; 
  if (response.rows.length===0) {
    return res.status(400).json({message:"utilisateur non trouvable "}) ; 
  }
    const user = response.rows[0] ;
    if (String(user.reste_code) !== String(code)) {
        return res.status(400).json({message:"code incorrect"}) ;
    }
    if (!user.expiration || user.expiration < new Date()) {
        return res.status(400).json({message:"code expiré"}) ;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10) ;
    const query2 = 'update users set password=$1, reste_code=null, expiration=null where email=$2' ; 
    await pool.query(query2, [hashedPassword, email]) ; 
    res.json({message:"mot de passe changé avec succès"}) ; 
}