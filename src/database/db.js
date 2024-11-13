const { Client } = require("pg");

// Configuração da conexão
console.log(process.env.DB_USER);

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

// Exportando o cliente para usar em outros arquivos
module.exports = client;
