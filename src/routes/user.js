const express = require("express");
const router = express.Router();
const { cadastro, login } = require("../controllers/user.controller"); // Importa o controlador

// Rota para inserir um novo usuário
router.post("/signup", cadastro);
router.post("/login", login);

module.exports = router;
