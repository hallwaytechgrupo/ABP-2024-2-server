const express = require("express");
const router = express.Router();
const {
  getQuestoes,
  createTentativa,
  getQuestoesByModulo,
  verificarAprovacao,
  getTentativasByUser,
} = require("../controllers/quiz.controller"); // Importa o controlador

// Definir as rotas
router.get("/", getQuestoes);
router.get("/modulo/:modulo", getQuestoesByModulo);
router.get("/verificarAprovacao/:email/:modulo", verificarAprovacao);
router.post("/tentativas", createTentativa);
router.get("/tentativas", getTentativasByUser);

module.exports = router;
