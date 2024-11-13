const express = require("express");
require("dotenv").config();

const path = require("path");

const user = require("./routes/user");
const quiz = require("./routes/quiz");
const cors = require("cors");

const app = express();
app.use(cors());

//ADICIONADO
// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const port = process.env.APP_PORT || 3000;

app.listen(port, () => {
  console.log(`Rodando na porta ${port}...`);
});

app.use("/user", user);
app.use("/quiz", quiz);
