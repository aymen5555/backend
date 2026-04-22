const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth",/routes/authRoutes); 
app.use ("/api/patients",/routes/patientRoutes);
app.use("/api/users",/routes/userRoutes);

app.listen(5000 , () => {
    console.log("Server is running on port 5000");
});