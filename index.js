const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const colors = require("colors");

dotenv.config();
const app = express();

// Connect to DB
const port = process.env.PORT || 5000;
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log("Connected to DB".cyan.underline);
    app.listen(port, () => {
      console.log(`Listening on port ${port}`.cyan.underline);
    });
  })
  .catch((err) => console.log(err));

app.set("views", __dirname + "/views"); //#
app.set("view engine", "ejs");

// Middleware & static files
app.use(express.static(__dirname + "/public")); //previous .static("public")
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use(userRoutes);

// 404
app.use((req, res) => {
  res.status(404).render("404", { title: "Not found" });
});
