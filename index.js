const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
const userRoutes = require("./routes/userRoutes");
app.use ("/api/users",userRoutes);
const patientRoutes = require("./routes/patientRoutes");
app.use("/api/patients", patientRoutes);

app.listen(5000 , () => {
    console.log("Server is running on port 5000");
});