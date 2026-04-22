const express = require("express");
const router = express.Router();
const { login, verifyEmail } = require("../controllers/authController");

router.post("/login", login);
router.get("/verify-email", verifyEmail);

module.exports = router;