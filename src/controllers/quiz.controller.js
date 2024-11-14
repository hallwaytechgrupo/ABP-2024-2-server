const pool = require('../database/db');


const getQuestoes = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM questao');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro ao obter questões:', err);
    res.status(500).json({ error: 'Erro ao obter questões' });
  } finally {
    client.release();
  }
};


const getQuestoesByModulo = async (req, res) => {
  const { modulo } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM questao WHERE modulo = $1', [modulo]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro ao obter questões pelo módulo:', err);
    res.status(500).json({ error: 'Erro ao obter questões pelo módulo' });
  } finally {
    client.release();
  }
};


const getQuestaoById = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM questao WHERE idquestao = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Questão não encontrada' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao obter questão:', err);
        res.status(500).json({ error: 'Erro ao obter questão' });
    } finally {
        client.release();
    }
};


const createQuestao = async (req, res) => {
  const { modulo, enunciado, alternativa } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO questao (modulo, enunciado, alternativa) VALUES ($1, $2, $3) RETURNING *',
      [modulo, enunciado, alternativa]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar questão:', err);
    res.status(500).json({ error: 'Erro ao criar questão' });
  } finally {
    client.release();
  }
};


const getTentativasByEmail = async (req, res) => {
  const { email } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM tentativa WHERE email = $1', [email]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro ao obter tentativas:', err);
    res.status(500).json({ error: 'Erro ao obter tentativas' });
  } finally {
    client.release();
  }
};


const createTentativa = async (req, res) => {
    const { modulo, email, respostas } = req.body;
    const client = await pool.connect();
    try {
      
      const tentativaResult = await client.query(
        'INSERT INTO tentativa (modulo, email) VALUES ($1, $2) RETURNING idtentativa',
        [modulo, email]
      );
      const idtentativa = tentativaResult.rows[0].idtentativa;
      
      for (const resposta of respostas) {
        await client.query(
          'INSERT INTO resposta_usuario (idtentativa, idquestao, resposta) VALUES ($1, $2, $3)',
          [idtentativa, resposta.idquestao, resposta.resposta]
        );
      }
      
      const questoesResult = await client.query(
        'SELECT idquestao, alternativa FROM questao WHERE idquestao = ANY($1::int[])',
        [respostas.map(r => r.idquestao)]
      );
  
      let acertos = 0;

      for (const questao of questoesResult.rows) {
        const respostaUsuario = respostas.find(r => r.idquestao === questao.idquestao);
        if (respostaUsuario && respostaUsuario.resposta === questao.alternativa) {
          acertos++;
        }
      }
  
      const nota = acertos;

      await client.query(
        'UPDATE tentativa SET nota = $1 WHERE idtentativa = $2',
        [nota, idtentativa]
      );
  
      res.status(201).json({ idtentativa, nota });
    } catch (err) {
      console.error('Erro ao criar tentativa:', err);
      res.status(500).json({ error: 'Erro ao criar tentativa' });
    } finally {
      client.release();
    }
  };

module.exports = { getQuestoes, getQuestoesByModulo, getQuestaoById, createQuestao, getTentativasByEmail, createTentativa };