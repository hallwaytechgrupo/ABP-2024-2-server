const client = require("./db");
require("dotenv").config();

async function setupDatabase() {
  try {
    console.log("Conectando ao banco de dados...");
    await client.connect();
    console.log("✔ Banco de dados conectado!");

    console.log(" • Configurando banco de dados...");
    const tableExists = await client.query(`
      SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'usuario'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log("  ! A Tabela 'usuario' já existe.");
    } else {
      await client.query(`
      CREATE TABLE usuario (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        mail VARCHAR(255) NOT NULL UNIQUE,
      );
      `);
      console.log(" ✔ Tabela 'usuario' criada.");
    }

    // Inserir dados de teste se a tabela estiver vazia
    console.log("Inserindo dados de teste na tabela 'usuario'...");
    const result = await client.query("SELECT COUNT(*) FROM usuario;");
    if (Number.parseInt(result.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO usuario (name, password, mail)
        VALUES ('sudo apt get install', 'hollywood', 'sudo@sebeber.nao.case');
      `);
      console.log(" ✔ Dados de teste inseridos na tabela 'usuario'.");
    } else {
      console.log(" ⓘ Tabela 'usuario' já contém dados.");
    }

    console.log("✔ Banco de dados conectado e configurado!");
  } catch (err) {
    console.error("✘ Erro ao configurar o banco de dados:", err.stack);
    throw err;
  } finally {
    await client.end();
  }
}

module.exports = { setupDatabase };
