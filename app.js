const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/user");
const colors = require("colors");
const request = require("request");
const cheerio = require("cheerio");
const { update } = require("./models/user");

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
    console.log("Connected to DB".cyan.underline);
    app.listen(port, () => {
      console.log(`Listening on port ${port}`.cyan.underline);
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

app.get("/users/:handle/:invalidUrl", (req, res) => {
  const handle = req.params.handle;
  const invalidUrl = req.params.invalidUrl;

  // FETCH ALL USER SUBMISSIONS ON CF & store in subMap
  const API_URI = `https://codeforces.com/api/user.status?handle=${handle}&lang=en`;
  const subMap = new Map();

  async function getUserSubmissions() {
    const response = await fetch(API_URI);
    const tmp = await response.json();

    tmp.result.forEach((i) => {
      const str = `${i.problem.index}. ${i.problem.name}`;
      let prvsVerdict, newVerdict;
      if (subMap.get(str) === undefined) prvsVerdict = 0;
      else prvsVerdict = subMap.get(str);

      if (i.verdict === "OK") newVerdict = 2;
      else newVerdict = 1;

      subMap.set(str, Math.max(newVerdict, prvsVerdict));
    });

    //Render userDashboard with qns
    User.find({ handle })
      .then((results) => {
        // qns is an array of objects with _id & problemName
        const qns = results.map((result) => {
          let updatedVerdict;
          if (subMap.get(result.problemName) === undefined) updatedVerdict = 0;
          else updatedVerdict = subMap.get(result.problemName);

          return {
            _id: result._id,
            problemName: result.problemName,
            verdict: updatedVerdict,
          };
        });

        res.render("dashboard", {
          title: "Dashboard",
          qns,
          handle,
          invalidUrl,
        });
      })
      .catch((err) => console.log(err));
  }
  getUserSubmissions();
});

// POST requests
app.post("/users/:handle", (req, res) => {
  // Scrape problem name
  request(`${req.body.problemLink}`, (error, response, html) => {
    if (!error && response.statusCode === 200) {
      const $ = cheerio.load(html);
      const ps = $(".problem-statement .header .title");

      // Save in DB & redirect
      const entry = new User({
        handle: req.params.handle,
        problemName: ps.text(),
      });

      entry
        .save()
        .then((result) => res.redirect(`${req.url}/0`))
        .catch((err) => console.log(err));
    } else {
      res.redirect(`${req.url}/1`);
    }
  });
});

// DELETE requests
app.post("/delete", (req, res) => {
  User.findByIdAndDelete(req.body._id)
    .then((result) => {
      res.redirect(`/users/${req.body.handle}/0`);
    })
    .catch((err) => console.log(err));
});

// 404
app.use((req, res) => {
  res.status(404).render("404", { title: "Not found" });
});
