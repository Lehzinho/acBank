import orchestrator from "../../orchestrator";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import session from "models/session";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect `email` but correct `password`", async () => {
      await orchestrator.createUser({
        password: "senha-correta",
      });

      // Dados de entrada para criação do usuário
      const userData = {
        email: "email.errado@gmail.com",
        password: "senha-correta",
      };

      // Executa requisição POST para criar usuário
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Verifica status HTTP de sucesso
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
        status_code: 401,
      });
    });

    test("With incorrect `password` but correct `email`", async () => {
      await orchestrator.createUser({
        email: "email.correto@gmail.com",
      });

      // Dados de entrada para criação do usuário
      const userData = {
        email: "email.correto@gmail.com",
        password: "senha-incorreta",
      };

      // Executa requisição POST para criar usuário
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Verifica status HTTP de sucesso
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
        status_code: 401,
      });
    });

    test("With incorrect `password` and incorrect `email`", async () => {
      const user = await orchestrator.createUser({});
      // Dados de entrada para criação do usuário
      const userData = {
        email: "email.incorreto@gmail.com",
        password: "senha-incorreta",
      };

      // Executa requisição POST para criar usuário
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Verifica status HTTP de sucesso
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
        status_code: 401,
      });
    });
    test("With correct `password` and correct `email`", async () => {
      const user = await orchestrator.createUser({
        email: "correctemail@gmail.com",
        password: "correct-password",
      });
      // Dados de entrada para criação do usuário
      const userData = {
        email: "correctemail@gmail.com",
        password: "correct-password",
      };

      // Executa requisição POST para criar usuário
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Verifica status HTTP de sucesso
      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        created_at: responseBody.created_at,
        expires_at: responseBody.expires_at,
        id: responseBody.id,
        token: responseBody.token,
        updated_at: responseBody.updated_at,
        user_id: user.id,
      });
      // Assert: Verificar integridade dos dados dinâmicos
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const createdAt = new Date(responseBody.created_at);
      const expiresAt = new Date(responseBody.expires_at);

      createdAt.setMilliseconds(0);
      expiresAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MILLISECONDS);

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });
      expect(parsedSetCookie.session_id).toEqual({
        domain: "localhost",
        name: "session_id",
        value: responseBody.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        sameSite: "Lax",
        httpOnly: true,
      });
    });
  });
});
