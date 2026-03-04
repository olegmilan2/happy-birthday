const express = require("express");
const {
  getBirthdays,
  createBirthday,
} = require("../controllers/birthdays-controller");

const router = express.Router();

router.get("/birthdays", getBirthdays);
router.post("/birthdays", createBirthday);

module.exports = router;
