const express = require("express");

const router = express.Router();
const { cadastro, login } = require("../controllers/UserController"); // Importa o controlador

// Rota para inserir um novo usuário
router.post("/", cadastro);
router.post("/login", login);

module.exports = router;
