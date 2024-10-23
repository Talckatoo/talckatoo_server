const express = require("express");
const router = express.Router();

const {
  getPrivateKey,
  getPublicKeys,
} = require("../controllers/crypto-controller");

router.route("/private/:userId").get(getPrivateKey);
router.route("/public").get(getPublicKeys);

module.exports = router;
