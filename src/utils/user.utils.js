async function validarEmail(email) {
  const query = {
    text: "SELECT id FROM users WHERE mail = $1",
    values: [email],
  };

  try {
    const result = await client.query(query);
    return result.rows.length > 0;
  } catch (err) {
    console.error(err);
    throw new Error("Erro ao validar e-mail");
  }
}

export { validarEmail };
