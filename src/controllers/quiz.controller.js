const pool = require("../database/db");

const getQuestoes = async (req, res) => {
  /*
    #swagger.tags = ['Quiz']
    #swagger.summary = 'Obter TODAS as questões'
    #swagger.description = 'Endpoint para obter todas as questões cadastradas no banco de dados.'
  */
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM questao");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao obter questões:", err);
    res.status(500).json({ error: "Erro ao obter questões" });
  } finally {
    client.release();
  }
};

const getQuestoesByModulo = async (req, res) => {
  /*
    #swagger.tags = ['Quiz']
    #swagger.summary = 'Obter questões por módulo'
    #swagger.description = 'Endpoint para obter todas as questões de um módulo específico.'
  */
  const { modulo } = req.params;

  const client = await pool.connect();
  try {
    const moduloInt = Number.parseInt(modulo, 10);
    if (moduloInt !== 1 && moduloInt !== 2 && moduloInt !== 3) {
      return res.status(400).json({ error: "Módulo não encontrado!" });
    }
    const result = await client.query(
      "SELECT * FROM questao WHERE modulo = $1",
      [modulo],
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao obter questões pelo módulo:", err);
    res.status(500).json({ error: "Erro ao obter questões pelo módulo" });
  } finally {
    client.release();
  }
};

// Função para criar uma nova tentativa e calcular a nota
const createTentativa = async (req, res) => {
  /*
    #swagger.tags = ['Quiz']
    #swagger.summary = 'Criar tentativa'
    #swagger.description = 'Endpoint para criar uma nova tentativa e calcular a nota.'
  */
  const { modulo, email, respostas } = req.body;

  // Verificar se os campos foram preenchidos
  if (!modulo || !email || !respostas) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  const client = await pool.connect();
  try {
    // Obter o ID do usuário com base no email
    const userResult = await client.query(
      "SELECT id FROM usuario WHERE email = $1",
      [email],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const userId = userResult.rows[0].id;

    // Obter as questões do módulo
    const questoesResult = await client.query(
      "SELECT idquestao, alternativa FROM questao WHERE modulo = $1",
      [modulo],
    );

    // Verificar se o número de questões corresponde ao número de respostas
    if (questoesResult.rows.length !== respostas.length) {
      return res
        .status(400)
        .json({
          error: "Número de respostas não corresponde ao número de questões",
        });
    }

    // Calcular a nota
    let acertos = 0;
    const respostasMap = {};
    respostas.forEach((resposta, index) => {
      respostasMap[`idquestao${index + 1}`] = resposta.idquestao;
      respostasMap[`resposta${index + 1}`] = resposta.resposta;
      const questao = questoesResult.rows.find(
        (q) => q.idquestao === resposta.idquestao,
      );
      if (questao && resposta.resposta === questao.alternativa) {
        acertos++;
      }
    });

    const nota = acertos;

    // Criar a tentativa com as respostas e a nota
    const tentativaResult = await client.query(
      `INSERT INTO tentativa (userid, modulo, idquestao1, resposta1, idquestao2, resposta2, idquestao3, resposta3, nota)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING idtentativa`,
      [
        userId,
        modulo,
        respostasMap.idquestao1,
        respostasMap.resposta1,
        respostasMap.idquestao2,
        respostasMap.resposta2,
        respostasMap.idquestao3,
        respostasMap.resposta3,
        nota,
      ],
    );

    res
      .status(201)
      .json({ idtentativa: tentativaResult.rows[0].idtentativa, nota });
  } catch (err) {
    console.error("Erro ao criar tentativa:", err);
    res.status(500).json({ error: "Erro ao criar tentativa" });
  } finally {
    client.release();
  }
};

const verificarAprovacao = async (req, res) => {
  /*
    #swagger.tags = ['Quiz']
    #swagger.summary = 'Verificar aprovação'
    #swagger.description = 'Endpoint para verificar se um usuário foi aprovado em um módulo específico.'
  */
  const { email, modulo } = req.params;

  // Verificar se os campos foram preenchidos
  if (!email || !modulo) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  const client = await pool.connect();
  try {
    // Obter o ID do usuário com base no email
    const userResult = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    console.log(userResult.rows);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const userId = userResult.rows[0].id;

    // Verificar as tentativas do usuário no módulo especificado
    const result = await client.query(
      "SELECT nota FROM tentativa WHERE userid = $1 AND modulo = $2",
      [userId, modulo],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({
          error: "Nenhuma tentativa encontrada para este módulo e usuário",
        });
    }

    const aprovado = result.rows.some((tentativa) => tentativa.nota >= 2);

    if (aprovado) {
      res
        .status(200)
        .json({ aprovado: true, message: "Usuário aprovado no módulo" });
    } else {
      res
        .status(200)
        .json({ aprovado: false, message: "Usuário não aprovado no módulo" });
    }
  } catch (err) {
    console.error("Erro ao verificar aprovação:", err);
    res.status(500).json({ error: "Erro ao verificar aprovação" });
  } finally {
    client.release();
  }
};

const getTentativasByUser = async (req, res) => {
  /*
    #swagger.tags = ['Quiz']
    #swagger.summary = 'Obter tentativas por usuário'
    #swagger.description = 'Endpoint para obter todas as tentativas de um usuário.'
  */
  const { email } = req.body;

  // Verificar se os campos foram preenchidos
  if (!email) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT t.* 
       FROM tentativa t
       JOIN usuario u ON t.userid = u.id
       WHERE u.mail = $1`,
      [email],
    );
    console.log(email);
    console.log(result.rows);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Nenhuma tentativa encontrada para este usuário" });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao obter tentativas:", err);
    res.status(500).json({ error: "Erro ao obter tentativas" });
  } finally {
    client.release();
  }
};

module.exports = {
  getQuestoes,
  getQuestoesByModulo,
  createTentativa,
  verificarAprovacao,
  getTentativasByUser,
};
