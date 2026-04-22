const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../Database");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const result = await database.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    if (!user.is_verified) {
      return res.status(403).json({ message: "Verify your email first" });
    }

    const valid = await bcrypt.compare(password, user.mot_de_passe);

    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, role: user.role });

  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const result = await database.query(
      "SELECT * FROM users WHERE verification_token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).send("Invalid token");
    }

    await database.query(
      `UPDATE users
       SET is_verified = true,
           status = 'active',
           verification_token = NULL
       WHERE verification_token = $1`,
      [token]
    );

    res.send("Email verified successfully");

  } catch {
    res.status(500).send("Server error");
  }
};