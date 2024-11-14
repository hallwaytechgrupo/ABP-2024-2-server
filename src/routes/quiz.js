const express = require('express');

const router = express.Router();

const { getQuestoes, createQuestao, getTentativasByEmail, createTentativa, getQuestaoById, getQuestoesByModulo } = require("../controllers/quiz.controller"); // Importa o controlador

// Definir as rotas
router.get('/questoes', getQuestoes);
router.get('/questoes/modulo/:modulo', getQuestoesByModulo);
router.get('/questoes/:id', getQuestaoById);
router.get('/tentativas/:email', getTentativasByEmail);
router.post('/questoes', createQuestao);
router.post('/tentativas', createTentativa);

module.exports = router;