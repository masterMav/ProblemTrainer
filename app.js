const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/user");

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
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.render("home", { title: "Home" });
});

app.get("/users/:handle", (req, res) => {
  const handle = req.url.substring(7);

  User.find({ handle: handle })
    .then((results) => {
      const qns = results.map((result) => {
        return result.problemName;
      });
      res.render("dashboard", { title: "Dashboard", qns, handle });
    })
    .catch((err) => console.log(err));
});

// POST requests
app.post("/users/:handle", (req, res) => {
  const handle = req.url.substring(7);
  const entry = new User({ handle, problemName: req.body.problemName });

  entry
    .save()
    .then((result) => res.redirect(req.url))
    .catch((err) => console.log(err));
});

app.use((req, res) => {
  res.status(404).render("404", { title: "Not found" });
});
