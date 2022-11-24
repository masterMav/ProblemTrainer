const User = require("../models/user");
const Problem = require("../models/problem");
const request = require("request");
const cheerio = require("cheerio");
const { response } = require("express");
const fetch = (url) =>
  import("node-fetch").then(({ default: fetch }) => fetch(url));

// Controller functions
const home = (req, res) => {
  res.render("home", { title: "Home", errorCode: req.params.id });
};

const userList = (req, res) => {
  const handle = req.params.handle;
  const invalidUrl = req.params.invalidUrl;

  // FETCH ALL USER SUBMISSIONS ON CF & store in subMap
  const API_URI = `https://codeforces.com/api/user.status?handle=${handle}&lang=en`;
  const subMap = new Map();

  const checkFetch = (response) => {
    if (!response.ok) throw Error("CF API ERROR");
    return response;
  };

  fetch(API_URI)
    .then(checkFetch)
    .then((response) => response.json())
    .then((data) => {
      data.result.forEach((i) => {
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
          // qns is an array of objects with _id, problemName & verdict
          const qns = results.map((result) => {
            let updatedVerdict;
            if (subMap.get(result.problemName) === undefined)
              updatedVerdict = 0;
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
    })
    .catch((err) => {
      res.render("dashboard", {
        title: "Dashboard",
        qns: [],
        handle,
        invalidUrl: "2",
      });
    });
};

const userList_add = (req, res) => {
  // Ensure Valid code format
  const codeArray = req.body.problemCode.split("_");
  if (codeArray.length != 2 || codeArray[0] === "" || codeArray[1] === "") {
    res.redirect(`${req.url}/1`);
  } else {
    // Search problemDB
    Problem.findOne({ contestId: codeArray[0], index: codeArray[1] })
      .then((result) => {
        if (result === null) {
          //Problem not found in problemDB
          res.redirect(`${req.url}/1`);
        } else {
          //Search userDB
          const str = `${codeArray[1]}. ${result.name}`;
          User.findOne({ handle: req.params.handle, problemName: str })
            .then((result) => {
              if (result === null) {
                // Save in userDB & redirect
                const entry = new User({
                  handle: req.params.handle,
                  problemName: str,
                });

                entry
                  .save()
                  .then((result) => res.redirect(`${req.url}/0`))
                  .catch((err) => console.log(err));
              } else {
                //Problem Already Exists in userDB
                res.redirect(`${req.url}/3`);
              }
            })
            .catch((err) => console.log(err));
        }
      })
      .catch((err) => res.send(err));
  }
};

const userList_delete = (req, res) => {
  User.findByIdAndDelete(req.body._id)
    .then((result) => {
      res.redirect(`/users/${req.body.handle}/0`);
    })
    .catch((err) => console.log(err));
};

const login = (req, res) => {
  const checkFetch = (response) => {
    if (response.status === 400) {
      res.redirect("/home/2");
      throw new Error("INVALID HANDLE");
    } else if (!response.ok) {
      res.redirect("/home/1");
      throw new Error("CF API ERROR");
    }
    return response;
  };

  //check user handle by fetch user.info
  const handle = req.body.userHandle;
  const API_URI = `https://codeforces.com/api/user.info?handles=${handle}`;
  fetch(API_URI)
    .then(checkFetch)
    .then((response) => response.json())
    .then((data) => {
      res.redirect(`/users/${handle}/0`);
    })
    .catch((err) => console.log(err.message));
};

module.exports = {
  home,
  userList,
  userList_add,
  userList_delete,
  login,
};
