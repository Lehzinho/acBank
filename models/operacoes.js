import database from "../infra/database";
import { ValidationError } from "../infra/errors";
import user from "./users.js";

async function create({
  usuario_origem_email,
  usuario_destino_email,
  tipo,
  valor,
  descricao,
}) {
  const usuarioOrigem = await user.findOneByEmail(usuario_origem_email);
  const usuarioDestino = await user.findOneByEmail(
    tipo === "TRANSFERENCIA" ? usuario_destino_email : usuario_origem_email
  );

  if (tipo === "TRANSFERENCIA" && usuarioOrigem.saldo < valor) {
    throw new ValidationError({
      message: "Fundos insuficientes.",
      action: "Verifique o saldo da conta.",
    });
  }

  const results = await database.query({
    text: `
      INSERT INTO 
      operacoes (usuario_origem_id, usuario_destino_id, tipo, valor, descricao)
      VALUES 
      ($1, $2, $3, $4, $5)
      RETURNING
      *
      ;`,
    values: [usuarioOrigem.id, usuarioDestino.id, tipo, valor, descricao],
  });

  const balance = await user.updateBalance(
    usuarioOrigem.id,
    usuarioDestino.id,
    valor,
    tipo
  );

  return { ...results.rows[0], ...balance };
}

async function getTransactionsByUserId(usuario) {
  const results = await database.query({
    text: `
        SELECT
          *
        FROM 
          operacoes
        WHERE
          usuario_destino_id = $1 OR usuario_origem_id = $1
        ORDER BY created_at DESC
      ;`,
    values: [usuario],
  });
  return results.rows; // Retorna todas as transações, não apenas a primeira
}
const operacoes = {
  create,
  getTransactionsByUserId,
};

export default operacoes;
