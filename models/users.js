import database from "../infra/database";
import password from "../models/password";
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from "../infra/errors";

async function findOneByUsername(username) {
  const userFound = await runSelecQuery(username);
  return userFound;

  async function runSelecQuery(username) {
    const results = await database.query({
      text: `
      SELECT
          *
        FROM 
          usuarios
        WHERE
          LOWER(nome) = LOWER($1)
        LIMIT
          1
          ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encotrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function findOneById(id) {
  const userFound = await runSelecQuery(id);
  return userFound;

  async function runSelecQuery(id) {
    const results = await database.query({
      text: `
      SELECT
          *
        FROM 
          usuarios
        WHERE
          id = $1
        LIMIT
          1
          ;`,
      values: [id],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
      });
    }

    return results.rows[0];
  }
}

async function findOneByEmail(email) {
  const userFound = await runSelecQuery(email);
  return userFound;

  async function runSelecQuery(email) {
    const results = await database.query({
      text: `
      SELECT
          *
        FROM 
          usuarios
        WHERE
          LOWER(email) = LOWER($1)
        LIMIT
          1
          ;`,
      values: [email],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
      });
    }

    return results.rows[0];
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
        SELECT
          nome
        FROM 
          usuarios
        WHERE
          LOWER(nome) = LOWER($1)
      ;`,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O usuário informado já está send utilizado",
      action: "Utilize outro nome de usuário para realizar esta operação.",
    });
  }
}

async function updateBalance(
  usuario_origem_id,
  usuario_destino_id,
  valor,
  type
) {
  const userSender = await findOneById(usuario_origem_id);
  const userReceiver = await findOneById(usuario_destino_id);

  if (valor <= 0) {
    throw new ValidationError({
      message: "Valor deve ser maior que zero",
      action: "Digite um valor Maior.",
    });
  }

  // Atualizar saldos

  const novoSaldoSender =
    type === "DEPOSITO" ? userSender.saldo : userSender.saldo - valor;
  const novoSaldoReceiver = userReceiver.saldo + valor;

  // Aqui você deve chamar funções para atualizar no banco de dados
  // Exemplo assumindo que você tem uma função updateUser:
  const userSenderFinal = await patchUser(usuario_origem_id, {
    saldo: novoSaldoSender,
  });
  const userReceiverFinal = await patchUser(usuario_destino_id, {
    saldo: novoSaldoReceiver,
  });

  return {
    senderBalance: userSenderFinal.saldo,
    receiverBalance: userReceiverFinal.saldo,
  };
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
        SELECT
          email
        FROM 
          usuarios
        WHERE
          LOWER(email) = LOWER($1)
      ;`,
    values: [email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está send utilizado",
      action: "Utilize outro email para realizar esta operação.",
    });
  }
}

async function patchUser(userId, updates) {
  // Validar se há atualizações para fazer
  if (!updates || Object.keys(updates).length === 0) {
    throw new ValidationError({
      message: "Nenhuma atualização fornecida",
      action: "Forneça pelo menos um campo para atualizar.",
    });
  }

  // Colunas permitidas para atualização (segurança)
  const allowedColumns = ["nome", "email", "password", "saldo"];

  // Filtrar apenas colunas permitidas
  const validUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedColumns.includes(key)) {
      validUpdates[key] = value;
    }
  }

  if (Object.keys(validUpdates).length === 0) {
    throw new ValidationError({
      message: "Nenhuma coluna válida para atualização",
      action: "Forneça campos válidos: " + allowedColumns.join(", "),
    });
  }

  // Construir a query dinamicamente
  const setClause = Object.keys(validUpdates)
    .map((key, index) => `${key} = $${index + 2}`)
    .join(", ");

  const values = [userId, ...Object.values(validUpdates)];

  const query = {
    text: `
      UPDATE usuarios 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `,
    values: values,
  };

  try {
    const result = await database.query(query);

    if (result.rowCount === 0) {
      throw new ValidationError({
        message: "Usuário não encontrado",
        action: "Verifique se o ID do usuário está correto.",
      });
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    // Tratar erro de email duplicado (se aplicável)
    if (error.code === "23505" && error.constraint === "usuarios_email_key") {
      throw new ValidationError({
        message: "O email informado já está sendo utilizado",
        action: "Utilize outro email para realizar esta operação.",
      });
    }

    throw error;
  }
}

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.nome);
  await hashPasswordInObject(userInputValues);
  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function hashPasswordInObject(userInputValues) {
    const hashedPassword = await password.hash(userInputValues.password);
    userInputValues.password = hashedPassword;
  }

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
          INSERT INTO 
            usuarios (nome, email, password)
          VALUES 
            ($1, $2, $3)
          RETURNING
            *
          ;`,
      values: [
        userInputValues.nome,
        userInputValues.email,
        userInputValues.password,
      ],
    });
    return results.rows[0];
  }
}

const user = {
  create,
  findOneByUsername,
  findOneByEmail,
  findOneById,
  patchUser,
  updateBalance,
};

export default user;
