

const express = require('express');
require('dotenv').config();

const path = require('path'); // ADICIONADO

const user = require("./routes/user");

const app = express();

//ADICIONADO
// Middleware para servir arquivos estáticos

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

const port = process.env.PORT || 3000;
// || 3000 adicionado

app.listen(port, () => {
    console.log(`Rodando na porta ${port}...`);
});

app.use("/user", user);