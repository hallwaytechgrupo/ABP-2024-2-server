const pool = require("../database/db");
const { emailExistente } = require("../utils/user.utils");

async function cadastro(req, res) {
  const { name, password, mail } = req.body;

  // Verificar se o email já existe
  if (await emailExistente(mail)) {
    return res.status(400).json({ message: "E-mail já cadastrado!" });
  }

  const query = {
    text: "INSERT INTO usuario (name, password, mail) VALUES ($1, $2, $3) RETURNING id, name, mail",
    values: [name, password, mail],
  };

  const client = await pool.connect();
  try {
    const result = await client.query(query);
    console.log(result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.json({ message: err.message });
  } finally {
    client.release();
  }
}

module.exports = { cadastro };

// Função para validar o login
async function login(req, res) {
  console.log("Login");
  const { mail, password } = req.body;

  // Recuperar o usuário do banco de dados pelo e-mail
  const query = {
    text: "SELECT id, name, mail, password FROM usuario WHERE mail = $1 AND password = $2",
    values: [mail, password],
  };

  const client = await pool.connect();
  try {
    const result = await client.query(query);

    // Se o usuário não existir, retornamos um erro
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "E-mail ou senha inválidos" });
    }

    const user = result.rows[0];
    // Retornar o usuário
    res.json({
      id: user.id,
      name: user.name,
      mail: user.mail,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
}

module.exports = { cadastro, login };
