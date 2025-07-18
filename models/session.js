import database from "../infra/database.js";
import crypto from "node:crypto";
import * as cookie from "cookie";
import { UnauthorizedError } from "../infra/errors.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 2 * 1000; // 2 HORAS

async function authenticate(cookieHeader) {
  try {
    if (!cookieHeader) {
      throw new UnauthorizedError({
        message: "Sessão não encontrada.",
        action: "Faça login para acessar este recurso.",
      });
    }

    // Parse dos cookies
    const cookies = cookie.parse(cookieHeader);
    const sessionToken = cookies.session_id;

    if (!sessionToken) {
      throw new UnauthorizedError({
        message: "Token de sessão não encontrado.",
        action: "Faça login para acessar este recurso",
      });
    }

    // Verifica se a sessão é válida
    const sessionData = await verify(sessionToken);

    if (!sessionData) {
      throw new UnauthorizedError({
        message: "Sessão inválida ou expirada.",
        action: "Faça login novamente",
      });
    }
    return sessionData;
  } catch (error) {
    throw new UnauthorizedError(error, { status_code: error.status_code });
  }
}

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newSession = await runInsertQuery(token, userId, expiresAt);
  return newSession;

  async function runInsertQuery(token, userId, expiresAt) {
    const results = await database.query({
      text: `
            INSERT INTO
                sessions (token, user_id, expires_at)
            VALUES
                ($1, $2, $3)
            RETURNING
                *
            ;`,
      values: [token, userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function verify(token) {
  if (!token) {
    return null;
  }

  const results = await database.query({
    text: `
          SELECT 
            s.id, 
            s.token, 
            s.user_id, 
            s.expires_at, 
            s.created_at, 
            s.updated_at,
            u.email
          FROM 
              sessions s
              LEFT JOIN usuarios u ON s.user_id = u.id
          WHERE 
              s.token = $1 
              AND s.expires_at > timezone('utc', now())
          LIMIT 1
          ;`,
    values: [token],
  });

  if (results.rows.length === 0) {
    return null;
  }

  return results.rows[0];
}

const session = {
  create,
  verify,
  authenticate,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
