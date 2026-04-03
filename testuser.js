require("dotenv").config();

const {Pool} = require ("pg") ; 
const bcrypt = require('bcrypt');
const pool=new Pool({
    user: 'postgres',
    host: 'localhost',
    database: "Sante",
    password: "fedi123aaa",
    port:  5432,
});
// fonction pour insérer un utilisateur
async function addUser(cin, name, email, password,role) {
  const hashedPassword = await bcrypt.hash(password, 10); // hash
  const result = await pool.query(
    `INSERT INTO users (cin, name, email, password,role) 
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [cin, name, email, hashedPassword, role]
  );
  console.log("Utilisateur ajouté :", result.rows[0]);
}

// fonction pour tester login
async function loginUser(email, inputPassword) {
  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if(result.rows.length === 0) return console.log("Utilisateur non trouvé");

  const user = result.rows[0];
  const match = await bcrypt.compare(inputPassword, user.password);

  if(match) {
    console.log("Login réussi ✅", user);
  } else {
    console.log("Mot de passe incorrect ❌");
  }
}

// tester
(async () => {
  await addUser("11210426", "fedo", "fedij565@gmail.com", "fedi12345s","admin"); // insert
  await loginUser("fedij565@gmail.com", "fedi12345s"); // login correct
  await loginUser("fedij565@gmail.com", "wrongpass"); // login faux
  pool.end(); // fermer connexion
})();