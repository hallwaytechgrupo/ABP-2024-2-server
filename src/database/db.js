const { Client } = require("pg");

// Configuração da conexão
console.log(process.env.DB_USER);

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Conectar ao banco de dados
client
  .connect()
  .then(() => console.log("Conectado ao banco de dados com sucesso!"))
  .catch((err) =>
    console.error("Erro de conexão ao banco de dados:", err.stack),
  );

// Exportando o cliente para usar em outros arquivos
module.exports = client;
