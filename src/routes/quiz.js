const express = require("express");
const router = express.Router();

router.post("/", () => {});
router.get("/:modulo/:id", (req, res) => {
  const { modulo, id } = req.params;
  res.send(`Modulo: ${modulo}, ID: ${id}`);
});

module.exports = router;
