const express = require("express");
const router = express.Router();
const {
  getQuestoes,
  createTentativa,
  getQuestoesByModulo,
  verificarAprovacao,
  getTentativasByUser,
  verificarAprovacaoModulo,
  gerarCertificado,
} = require("../controllers/quiz.controller"); // Importa o controlador

// Definir as rotas
router.get("/", getQuestoes);
router.get("/modulo/:modulo", getQuestoesByModulo);
router.get("/verificarAprovacaoModulo/", verificarAprovacaoModulo);
router.get("/verificarAprovacao/", verificarAprovacao);
router.post("/tentativas", createTentativa);
router.get("/tentativas", getTentativasByUser);
router.post("/gerarCertificado", gerarCertificado);

module.exports = router;
