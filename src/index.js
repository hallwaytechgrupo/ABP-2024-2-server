const express = require("express");
require("dotenv").config();

const path = require("path");

const user = require("./routes/user");
const quiz = require("./routes/quiz");
const cors = require("cors");
const { setupDatabase } = require("./database/setup.db");

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
const morgan = require("morgan");

const app = express();
app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

app.use(morgan("dev"));

setupDatabase()
  .then(() => {
    const port = process.env.APP_PORT || 3000;

    app.listen(port, () => {
      console.log(`Rodando na porta ${port}...`);
    });

    app.use("/user", user);
    app.use("/quiz", quiz);
  })
  .catch((err) => {
    console.error(
      "Falha ao configurar o banco de dados. Servidor não iniciado.",
    );
    process.exit(1); // Encerra o processo com um código de erro
  });
