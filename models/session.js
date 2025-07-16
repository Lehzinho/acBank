import database from "../infra/database.js";
import crypto from "node:crypto";

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 2 * 1000; // 2 HORAS

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
        id, 
        token, 
        user_id, 
        expires_at, 
        created_at, 
        updated_at
      FROM 
        sessions 
      WHERE 
        token = $1 
        AND expires_at > timezone('utc', now())
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
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
