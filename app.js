const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

// Connect to DB
const port = process.env.PORT || 3000;
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log("Connected to DB");
    app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  })
  .catch((err) => console.log(err));

app.set("view engine", "ejs");

// Middleware & static files
app.use(express.static("public"));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.render("home", { title: "Home" });
});

app.get("/users/:id", (req, res) => {
  const qns = ["qn1", "qn2", "qn3", "qn4", "qn5", "qn6"];

  res.render("dashboard", { title: "Dashboard", qns });
});

app.use((req, res) => {
  res.status(404).render("404", { title: "Not found" });
});
