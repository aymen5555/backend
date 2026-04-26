const express = require("express");
const app = express();
const cors = require("cors"); 
app.use(cors());
app.use(express.json());

const authRoutes = require("./Route");
const userRoutes = require("./Routeusers");
app.use("/api", authRoutes); 
app.use("/api", userRoutes);

app.listen(5000 , () => {
    console.log("Server is running on port 5000");
});