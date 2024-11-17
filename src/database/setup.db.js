const pool = require("./db");
require("dotenv").config();

async function setupDatabase() {
  console.log("Conectando ao banco de dados...");
  const client = await pool.connect();
  try {
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
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL
      );
      `);
      console.log(" ✔ Tabela 'usuario' criada.");
    }

    console.log("Inserindo dados de teste na tabela 'usuario'...");
    const result = await client.query("SELECT COUNT(*) FROM usuario;");
    if (Number.parseInt(result.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO usuario (nome, senha, email)
        VALUES ('sudo apt get install', 'hollywood', 'sudo@sebeber.nao.case');
      `);
      console.log(" ✔ Dados de teste inseridos na tabela 'usuario'.");
    } else {
      console.log(" ⓘ Tabela 'usuario' já contém dados.");
    }

    // Criar tabela questao
    await client.query(`
      CREATE TABLE IF NOT EXISTS questao (
        idquestao SMALLSERIAL PRIMARY KEY,
        modulo SMALLINT NOT NULL,
        enunciado TEXT NOT NULL,
        alternativa BOOLEAN NOT NULL
      );
    `);
    console.log(" ✔ Tabela 'questao' criada.");

    // Criar tabela tentativa
    await client.query(`
      CREATE TABLE IF NOT EXISTS tentativa (
        idtentativa SMALLSERIAL PRIMARY KEY,
        userid SMALLINT NOT NULL,
        modulo SMALLINT NOT NULL,
        idquestao1 SMALLINT NOT NULL,
        idquestao2 SMALLINT NOT NULL,
        idquestao3 SMALLINT NOT NULL,
        resposta1 BOOLEAN NOT NULL,
        resposta2 BOOLEAN NOT NULL,
        resposta3 BOOLEAN NOT NULL,
        nota FLOAT,
        FOREIGN KEY (userid) REFERENCES usuario(id),
        FOREIGN KEY (idquestao1) REFERENCES questao(idquestao),
        FOREIGN KEY (idquestao2) REFERENCES questao(idquestao),
        FOREIGN KEY (idquestao3) REFERENCES questao(idquestao)
      );
    `);
    console.log(" ✔ Tabela 'tentativa' criada.");

    // Inserir dados de teste na tabela 'questao'
    console.log("Inserindo dados de teste na tabela 'questao'...");
    const questaoResult = await client.query("SELECT COUNT(*) FROM questao;");
    if (Number.parseInt(questaoResult.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO questao (modulo, enunciado, alternativa)
        VALUES 
        (1, 'O Scrum Master é responsável por maximizar o valor do produto.', false),
        (1, 'O Product Owner gerencia o backlog do produto.', true),
        (1, 'Um dos princípios do Scrum é a capacidade de adaptação às mudanças.', true),
        (2, 'A Sprint Review é o momento em que a equipe demonstra o incremento do produto para os stakeholders.', true),
        (2, 'O Sprint Planning é uma reunião realizada no final de cada Sprint para planejar a próxima.', false),
        (2, 'O Time de Desenvolvimento é auto-organizado e responsável pela criação do incremento.', true),
        (3, 'A escolha da ferramenta Scrum ideal depende apenas do tamanho da equipe.', false),
        (3, 'O GitHub é utilizado apenas para gerenciar código-fonte, não sendo adequado para outras atividades como planejamento e colaboração.', false),
        (3, 'As ferramentas Scrum são obrigatórias para a implementação da metodologia.', false);
      `);
      console.log(" ✔ Dados de teste inseridos na tabela 'questao'.");
    } else {
      console.log(" ⓘ Tabela 'questao' já contém dados.");
    }

    // Inserir tentativa de teste
    console.log("Inserindo tentativa de teste...");
    const tentativaResult = await client.query(
      "SELECT COUNT(*) FROM tentativa;",
    );
    if (Number.parseInt(tentativaResult.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO tentativa (userid, modulo, idquestao1, resposta1, idquestao2, resposta2, idquestao3, resposta3, nota)
        VALUES (
          (SELECT id FROM usuario WHERE email = 'sudo@sebeber.nao.case'), 
          1,
          1, true, 
          2, false, 
          3, true, 
          3
        );
      `);
      console.log(" ✔ Tentativa de teste inserida.");
    } else {
      console.log(" ⓘ Tabela 'tentativa' já contém dados.");
    }

    console.log("✔ Banco de dados conectado e configurado!");
  } catch (err) {
    console.error("✘ Erro ao configurar o banco de dados:", err.stack);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { setupDatabase };
