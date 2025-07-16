import orchestrator from "../../orchestrator";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import session from "models/session";
import database from "infra/database";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/sessions/verify", () => {
  describe("Anonymous user", () => {
    test("Without session cookie", async () => {
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "GET",
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Sessão não encontrada.",
        action: "Faça login para acessar este recurso",
        status_code: 401,
      });
    });

    test("With invalid session token", async () => {
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "GET",
        headers: {
          Cookie: "session_id=invalid-token-123",
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Sessão inválida ou expirada.",
        action: "Faça login novamente",
        status_code: 401,
      });
    });
    test("With expired session token", async () => {
      // Criar usuário e sessão válida
      const user = await orchestrator.createUser({
        email: "user@example.com",
        password: "password123",
      });

      // Criar sessão manualmente com data expirada
      const expiredSession = await session.create(user.id);

      // Simular sessão expirada diretamente no banco
      await database.query({
        text: "UPDATE sessions SET expires_at = $1 WHERE id = $2",
        values: [new Date(Date.now() - 1000), expiredSession.id], // 1 segundo atrás
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "GET",
        headers: {
          Cookie: `session_id=${expiredSession.token}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Sessão inválida ou expirada.",
        action: "Faça login novamente",
        status_code: 401,
      });
    });
  });

  describe("Authenticated user", () => {
    test("With valid session token", async () => {
      // Criar usuário
      const user = await orchestrator.createUser({
        email: "valid@example.com",
        password: "password123",
      });

      // Criar sessão através do endpoint de login
      const loginResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "valid@example.com",
            password: "password123",
          }),
        }
      );

      expect(loginResponse.status).toBe(201);

      const loginResponseBody = await loginResponse.json();
      const sessionToken = loginResponseBody.token;

      // Verificar sessão
      const verifyResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "GET",
          headers: {
            Cookie: `session_id=${sessionToken}`,
          },
        }
      );

      expect(verifyResponse.status).toBe(200);

      const verifyResponseBody = await verifyResponse.json();

      expect(verifyResponseBody).toEqual({
        valid: true,
        user_id: user.id,
        expires_at: verifyResponseBody.expires_at,
      });

      // Verificar integridade dos dados
      expect(uuidVersion(verifyResponseBody.user_id)).toBe(4);
      expect(Date.parse(verifyResponseBody.expires_at)).not.toBeNaN();

      // Verificar que a data de expiração é futura
      const expiresAt = new Date(verifyResponseBody.expires_at);
      const now = new Date();
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    test("With valid session token multiple times", async () => {
      // Criar usuário
      const user = await orchestrator.createUser({
        email: "multiple@example.com",
        password: "password123",
      });

      // Criar sessão
      const validSession = await session.create(user.id);

      // Primeira verificação
      const firstResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "GET",
          headers: {
            Cookie: `session_id=${validSession.token}`,
          },
        }
      );

      expect(firstResponse.status).toBe(200);

      // Segunda verificação (deve funcionar normalmente)
      const secondResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "GET",
          headers: {
            Cookie: `session_id=${validSession.token}`,
          },
        }
      );

      expect(secondResponse.status).toBe(200);

      const firstBody = await firstResponse.json();
      const secondBody = await secondResponse.json();

      expect(firstBody).toEqual(secondBody);
    });

    test("With valid session token from different user", async () => {
      // Criar primeiro usuário
      const user1 = await orchestrator.createUser({
        email: "user1@example.com",
        password: "password123",
      });

      // Criar segundo usuário
      const user2 = await orchestrator.createUser({
        email: "user2@example.com",
        password: "password123",
      });

      // Criar sessão para user1
      const session1 = await session.create(user1.id);

      // Criar sessão para user2
      const session2 = await session.create(user2.id);

      // Verificar sessão do user1
      const response1 = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "GET",
        headers: {
          Cookie: `session_id=${session1.token}`,
        },
      });

      expect(response1.status).toBe(200);
      const responseBody1 = await response1.json();
      expect(responseBody1.user_id).toBe(user1.id);

      // Verificar sessão do user2
      const response2 = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "GET",
        headers: {
          Cookie: `session_id=${session2.token}`,
        },
      });

      expect(response2.status).toBe(200);
      const responseBody2 = await response2.json();
      expect(responseBody2.user_id).toBe(user2.id);

      // Verificar que são usuários diferentes
      expect(responseBody1.user_id).not.toBe(responseBody2.user_id);
    });
  });
});
