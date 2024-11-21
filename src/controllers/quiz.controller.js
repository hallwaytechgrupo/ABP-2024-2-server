const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("node:fs");
const path = require("path");
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

    // Buscar as questões do módulo no banco de dados
    const questoesQuery = {
      text: "SELECT idquestao, alternativa FROM questao WHERE idquestao = ANY($1::int[])",
      values: [respostas.map((r) => r.idquestao)],
    };

    const questoesResult = await client.query(questoesQuery);
    const questoes = questoesResult.rows;

    // Calcular a nota com base nas respostas
    let nota = 0;
    for (const resposta of respostas) {
      const questao = questoes.find((q) => q.idquestao === resposta.idquestao);
      if (questao && questao.alternativa === resposta.resposta) {
        nota += 1;
      }
    }

    // Inserir a tentativa no banco de dados
    const tentativaQuery = {
      text: `
        INSERT INTO tentativa (userid, modulo, idquestao1, resposta1, idquestao2, resposta2, idquestao3, resposta3, nota)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING idtentativa
      `,
      values: [
        userId,
        modulo,
        respostas[0].idquestao,
        respostas[0].resposta,
        respostas[1].idquestao,
        respostas[1].resposta,
        respostas[2].idquestao,
        respostas[2].resposta,
        nota,
      ],
    };

    const tentativaResult = await client.query(tentativaQuery);
    res
      .status(201)
      .json({
        idtentativa: tentativaResult.rows[0].idtentativa,
        nota: nota,
        aprovado: nota >= 2,
      });
  } catch (err) {
    console.error("Erro ao criar tentativa:", err);
    res.status(500).json({ error: "Erro ao criar tentativa" });
  } finally {
    client.release();
  }
};

const verificarAprovacaoModulo = async (req, res) => {
  /*
    #swagger.tags = ['Quiz']
    #swagger.summary = 'Verificar aprovação'
    #swagger.description = 'Endpoint para verificar se um usuário foi aprovado em um módulo específico.'
  */
  const { email, modulo } = req.body;

  // Verificar se os campos foram preenchidos
  if (!email || !modulo) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  const client = await pool.connect();
  try {
    // Obter o ID do usuário com base no email
    const userResult = await client.query(
      "SELECT id FROM usuario WHERE email = $1",
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
      return res.status(404).json({
        aprovado: false,
        message: "Nenhuma tentativa encontrada para este módulo e usuário",
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

const verificarAprovacao = async (req, res) => {
  /*
    #swagger.tags = ['Quiz']
    #swagger.summary = 'Verificar progresso'
    #swagger.description = 'Endpoint para verificar o progresso de um usuário em todos os módulos.'
  */
  const { email } = req.body;

  // Verificar se o campo email foi preenchido
  if (!email) {
    return res.status(400).json({ error: "O campo email é obrigatório" });
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

    // Verificar aprovação em cada módulo
    const modulos = [1, 2, 3];
    const progresso = {};

    for (const modulo of modulos) {
      const result = await client.query(
        "SELECT COUNT(*) AS aprovado FROM tentativa WHERE userid = $1 AND modulo = $2 AND nota >= 2",
        [userId, modulo],
      );

      progresso[`modulo-${modulo}`] = result.rows[0].aprovado > 0;
    }

    res.status(200).json(progresso);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
        .json({
          aprovado: false,
          error: "Nenhuma tentativa encontrada para este usuário",
        });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao obter tentativas:", err);
    res.status(500).json({ error: "Erro ao obter tentativas" });
  } finally {
    client.release();
  }
};

const gerarCertificado = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "O campo email é obrigatório" });
  }

  const client = await pool.connect();
  try {
    // Obter o nome do usuário com base no email
    const userResult = await client.query(
      "SELECT id, nome FROM usuario WHERE email = $1",
      [email],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const userId = userResult.rows[0].id;
    const nome = userResult.rows[0].nome;

    // Verificar aprovação em todos os módulos
    const modulos = [1, 2, 3];
    const progresso = {};

    for (const modulo of modulos) {
      const result = await client.query(
        "SELECT COUNT(*) AS aprovado FROM tentativa WHERE userid = $1 AND modulo = $2 AND nota >= 2",
        [userId, modulo],
      );

      progresso[`modulo-${modulo}`] = result.rows[0].aprovado > 0;
    }

    const aprovadoEmTodosOsModulos = Object.values(progresso).every(
      (status) => status,
    );

    if (!aprovadoEmTodosOsModulos) {
      return res
        .status(400)
        .json({ error: "Usuário não aprovado em todos os módulos" });
    }

    const existingPdfBytes = fs.readFileSync(
      path.join(__dirname, "../../assets/certificado.pdf"),

    );

    console.log("path", path.join(__dirname, "../../assets/certificado.pdf"));


    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync(path.join(__dirname, '../../assets/montserrat.ttf'));
    const fontBytes_2 = fs.readFileSync(path.join(__dirname, '../../assets/signature.ttf'));
    const montserrat = await pdfDoc.embedFont(fontBytes);
    const signature = await pdfDoc.embedFont(fontBytes_2);

    // Get the first page of the document
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Define the text to be added
    const nomeUpper = nome;

    // Calculate text width and height
    const textSize = 60;
    const textWidth = signature.widthOfTextAtSize(nomeUpper, textSize);
    const textHeight = signature.heightAtSize(textSize);

    // Add text to the first page
    firstPage.drawText(nomeUpper, {
      x: 574 - textWidth / 2,
      y: 100 - textHeight / 2 + 32,
      size: textSize,
      font: signature,
      color: rgb(0.1, 0.4, 0.73),
    });

    // Get the current date and format it
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDate = now.toLocaleDateString("pt-BR", options);
    const formattedTime = now.toLocaleTimeString("pt-BR");

    // Define the date text to be added
    const dateText = `Gerado em: ${formattedDate} às ${formattedTime}`;

    // Calculate date text width and height
    const dateTextSize = 12;
    const dateTextWidth = montserrat.widthOfTextAtSize(dateText, dateTextSize);
    const dateTextHeight = montserrat.heightAtSize(dateTextSize);

    // Add date text to the first page
    firstPage.drawText(dateText, {
      x: 600 - dateTextWidth / 2,
      y: 30 - dateTextHeight / 2 + 16,
      size: dateTextSize,
      font: montserrat,
      color: rgb(0.1, 0.4, 0.73),
    });

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Create a blob and open it in a new window
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Erro ao gerar certificado:", error);
    res.status(500).send("Erro ao gerar certificado");
  } finally {
    client.release();
  }
};

module.exports = {
  getQuestoes,
  getQuestoesByModulo,
  createTentativa,
  verificarAprovacaoModulo,
  verificarAprovacao,
  getTentativasByUser,
  gerarCertificado,
};
