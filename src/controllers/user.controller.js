const pool = require("../database/db");
const { emailExistente } = require("../utils/user.utils");

async function cadastro(req, res) {
  /*
    #swagger.tags = ['Usuario']
    #swagger.summary = 'Cadastrar novo usuário'
    #swagger.description = 'Endpoint para cadastrar um novo usuário, ao cadastrar, é retornado {id, nome, email}'
  */
  const { nome, senha, email } = req.body;

  // Verificar se os campos foram preenchidos
  if (!nome || !senha || !email) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios" });
  }

  console.log(nome, senha, email);

  // Verificar se o email já existe
  if (await emailExistente(email)) {
    return res.status(400).json({ message: "E-mail já cadastrado!" });
  }

  const query = {
    text: "INSERT INTO usuario (nome, senha, email) VALUES ($1, $2, $3) RETURNING id, nome, email",
    values: [nome, senha, email],
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
  /*
    #swagger.tags = ['Usuario']
    #swagger.summary = 'Login de usuário'
    #swagger.description = 'Endpoint para realizar o login de um usuário, ao logar, é retornado {id, nome, email}'
  */
  const { email, senha } = req.body;

  // Verificar se os campos foram preenchidos
  if (!email || !senha) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios" });
  }

  // Recuperar o usuário do banco de dados pelo e-mail
  const query = {
    text: "SELECT id, nome, email, senha FROM usuario WHERE email = $1 AND senha = $2",
    values: [email, senha],
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
      nome: user.nome,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
}

module.exports = { cadastro, login };
