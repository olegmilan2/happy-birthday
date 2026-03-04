const express = require("express");
const {
  getBirthdays,
  createBirthday,
  deleteBirthday,
} = require("../controllers/birthdays-controller");

const router = express.Router();

router.get("/birthdays", getBirthdays);
router.post("/birthdays", createBirthday);
router.delete("/birthdays/:id", deleteBirthday);

module.exports = router;
