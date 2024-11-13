const pool = require("../database/db");

const emailExistente = async (email) => {
  const client = await pool.connect();
  try {
    console.log("Verificando se o e-mail existe...");
    if (email != null){
      let consulta = "select count(*) from usuario where mail = $1";
      let resultado = await client.query(consulta,[email]);
      if (resultado.rows[0] == 1 ) {
        return true;
      } else{
        return false;
      }
    } else {
      return false
    }
    // Aqui você pode adicionar a lógica para verificar se o e-mail existe
    // const query = "SELECT COUNT(*) FROM usuario WHERE mail = $1";
    // const result = await client.query(query, [email]);
    // return result.rows[0].count > 0;
  } catch (err) {
    console.error("Erro ao verificar email existente:", err);
    throw err;
  } finally {
    client.release();
  }
  return false; // Retorno padrão, já que a lógica está ausente
};

module.exports = { emailExistente }
