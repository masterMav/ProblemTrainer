const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

router.get("/", userController.home);
router.get("/users/:handle/:invalidUrl", userController.userList);
router.post("/users/:handle", userController.userList_add);
router.post("/delete", userController.userList_delete);

module.exports = router;
