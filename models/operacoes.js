import database from "../infra/database";
import { ValidationError } from "../infra/errors";
import user from "./users.js";

async function create({
  usuario_origem_email,
  usuario_destino_email,
  tipo,
  valor,
  descricao,
  operacao_original_id = null,
}) {
  const usuarioOrigem = await user.findOneByEmail(usuario_origem_email);
  const usuarioDestino = await user.findOneByEmail(
    tipo !== "DEPOSITO" ? usuario_destino_email : usuario_origem_email
  );

  if (tipo !== "DEPOSITO" && usuarioOrigem.saldo < valor) {
    throw new ValidationError({
      message: "Fundos insuficientes.",
      action: "Verifique o saldo da conta.",
    });
  }

  const results = await database.query({
    text: `
      INSERT INTO 
      operacoes (usuario_origem_id, usuario_destino_id, tipo, valor, descricao, operacao_original_id)
      VALUES 
      ($1, $2, $3, $4, $5, $6)
      RETURNING
      *
      ;`,
    values: [
      usuarioOrigem.id,
      usuarioDestino.id,
      tipo,
      valor,
      descricao,
      operacao_original_id,
    ],
  });

  const balance = await user.updateBalance(
    usuarioOrigem.id,
    usuarioDestino.id,
    valor,
    tipo
  );

  return { ...results.rows[0], ...balance };
}

async function reimbursement(id, novoTipo, descricao) {
  const transaction = await getTransactionById(id);

  const response = await database.query({
    text: `
        UPDATE operacoes 
        SET 
          tipo = $1,
          revertida = $2
        WHERE 
          id = $3
        RETURNING
          *
        ;`,
    values: [novoTipo, true, transaction.id],
  });

  const operacao_original = response.rows[0];

  const usuarioOrigem = await user.findOneById(
    operacao_original.usuario_origem_id
  );
  const usuarioDestino = await user.findOneById(
    operacao_original.usuario_destino_id
  );

  const operacao_nova = await create({
    usuario_origem_email: usuarioDestino.email,
    usuario_destino_email: usuarioOrigem.email,
    tipo: "REINBOLSO",
    valor: operacao_original.valor,
    descricao: descricao,
    operacao_original_id: operacao_original.id,
  });

  return { operacao_nova: operacao_nova, operacao_original: operacao_original };
}

async function getTransactionById(id) {
  const results = await database.query({
    text: `
        SELECT
          *
        FROM 
          operacoes
        WHERE
          id = $1
        LIMIT
          1
      ;`,
    values: [id],
  });
  return results.rows[0]; // Retorna todas as transações, não apenas a primeira
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
  reimbursement,
  getTransactionById,
};

export default operacoes;
