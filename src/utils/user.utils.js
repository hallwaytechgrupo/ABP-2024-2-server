const pool = require("../database/db");

const emailExistente = async (email) => {
  const client = await pool.connect();
  try {
    console.log("Verificando se o e-mail existe...");
    if (email != null) {
      const consulta = "SELECT COUNT(*) FROM usuario WHERE mail = $1";
      const resultado = await client.query(consulta, [email]);
      if (Number(resultado.rows[0].count) === 1) {
        return true;
      }
      return false;
    }
    return false;
  } catch (err) {
    console.error("Erro ao verificar email existente:", err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { emailExistente };