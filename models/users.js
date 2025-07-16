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
};

export default user;
