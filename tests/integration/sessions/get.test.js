import orchestrator from "../../orchestrator";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import session from "models/session";
import database from "infra/database";

/**
 * Configuração inicial dos testes
 * - Aguarda todos os serviços ficarem prontos
 * - Limpa o banco de dados para garantir um estado limpo
 * - Executa migrações pendentes
 */
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

/**
 * Testes para o endpoint GET /api/v1/sessions/verify
 *
 * Este endpoint é responsável por verificar se uma sessão é válida
 * e retornar informações do usuário autenticado.
 *
 * Casos testados:
 * - Usuários anônimos (sem sessão ou com sessão inválida)
 * - Usuários autenticados (com sessão válida)
 */
describe("GET /api/v1/sessions/verify", () => {
  /**
   * Testes para usuários anônimos
   * Verifica o comportamento quando não há autenticação válida
   */
  describe("Anonymous user", () => {
    /**
     * Teste: Requisição sem cookie de sessão
     *
     * Cenário: Usuário faz requisição sem fornecer cookie de sessão
     * Resultado esperado: 401 Unauthorized com mensagem "Sessão não encontrada"
     */
    test("Without session cookie", async () => {
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "GET",
      });

      // Verifica se retorna status 401 (Unauthorized)
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      // Verifica estrutura da resposta de erro
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Sessão não encontrada.",
        action: "Faça login para acessar este recurso.",
        status_code: 401,
      });
    });

    /**
     * Teste: Requisição com token de sessão inválido
     *
     * Cenário: Usuário fornece um token que não existe no banco
     * Resultado esperado: 401 Unauthorized com mensagem "Sessão inválida ou expirada"
     */
    test("With invalid session token", async () => {
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "GET",
        headers: {
          Cookie: "session_id=invalid-token-123", // Token inexistente
        },
      });

      // Verifica se retorna status 401 (Unauthorized)
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      // Verifica estrutura da resposta de erro
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Sessão inválida ou expirada.",
        action: "Faça login novamente",
        status_code: 401,
      });
    });

    /**
     * Teste: Requisição com token de sessão expirado
     *
     * Cenário: Usuário fornece um token válido mas que já expirou
     * Resultado esperado: 401 Unauthorized com mensagem "Sessão inválida ou expirada"
     */
    test("With expired session token", async () => {
      // Criar usuário para o teste
      const user = await orchestrator.createUser({
        email: "user@example.com",
        password: "password123",
      });

      // Criar sessão válida
      const expiredSession = await session.create(user.id);

      // Simular expiração da sessão alterando diretamente no banco
      // Define expires_at como 1 segundo no passado
      await database.query({
        text: "UPDATE sessions SET expires_at = $1 WHERE id = $2",
        values: [new Date(Date.now() - 1000), expiredSession.id],
      });

      // Fazer requisição com token expirado
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "GET",
        headers: {
          Cookie: `session_id=${expiredSession.token}`,
        },
      });

      // Verifica se retorna status 401 (Unauthorized)
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      // Verifica estrutura da resposta de erro
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Sessão inválida ou expirada.",
        action: "Faça login novamente",
        status_code: 401,
      });
    });
  });

  /**
   * Testes para usuários autenticados
   * Verifica o comportamento quando há autenticação válida
   */
  describe("Authenticated user", () => {
    /**
     * Teste: Requisição com token de sessão válido
     *
     * Cenário: Usuário autenticado faz requisição com sessão válida
     * Resultado esperado: 200 OK com dados do usuário e sessão
     */
    test("With valid session token", async () => {
      // Criar usuário para o teste
      const user = await orchestrator.createUser({
        email: "valid@example.com",
        password: "password123",
      });

      // Fazer login para obter token de sessão válido
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

      // Verifica se login foi bem-sucedido
      expect(loginResponse.status).toBe(201);

      const loginResponseBody = await loginResponse.json();
      const sessionToken = loginResponseBody.token;

      // Verificar sessão usando o token obtido
      const verifyResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "GET",
          headers: {
            Cookie: `session_id=${sessionToken}`,
          },
        }
      );

      // Verifica se retorna status 200 (OK)
      expect(verifyResponse.status).toBe(200);

      const verifyResponseBody = await verifyResponse.json();

      // Verifica estrutura da resposta de sucesso
      expect(verifyResponseBody).toEqual({
        email: "valid@example.com",
        valid: true,
        user_id: user.id,
        expires_at: verifyResponseBody.expires_at, // Data dinâmica
      });

      // Verificações de integridade dos dados
      expect(uuidVersion(verifyResponseBody.user_id)).toBe(4); // UUID v4
      expect(Date.parse(verifyResponseBody.expires_at)).not.toBeNaN(); // Data válida

      // Verificar que a sessão não expirou
      const expiresAt = new Date(verifyResponseBody.expires_at);
      const now = new Date();
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    /**
     * Teste: Múltiplas verificações com mesmo token
     *
     * Cenário: Usuário faz múltiplas requisições com o mesmo token válido
     * Resultado esperado: Todas as requisições devem ser bem-sucedidas
     * e retornar os mesmos dados
     */
    test("With valid session token multiple times", async () => {
      // Criar usuário para o teste
      const user = await orchestrator.createUser({
        email: "multiple@example.com",
        password: "password123",
      });

      // Criar sessão válida
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

      // Segunda verificação com mesmo token
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

      // Verificar que ambas as respostas são idênticas
      const firstBody = await firstResponse.json();
      const secondBody = await secondResponse.json();

      expect(firstBody).toEqual(secondBody);
    });

    /**
     * Teste: Isolamento entre sessões de diferentes usuários
     *
     * Cenário: Dois usuários diferentes com sessões válidas
     * Resultado esperado: Cada sessão deve retornar dados do usuário correto
     * e os dados não devem se misturar
     */
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

      // Criar sessão para cada usuário
      const session1 = await session.create(user1.id);
      const session2 = await session.create(user2.id);

      // Verificar sessão do primeiro usuário
      const response1 = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "GET",
        headers: {
          Cookie: `session_id=${session1.token}`,
        },
      });

      expect(response1.status).toBe(200);
      const responseBody1 = await response1.json();
      expect(responseBody1.user_id).toBe(user1.id);

      // Verificar sessão do segundo usuário
      const response2 = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "GET",
        headers: {
          Cookie: `session_id=${session2.token}`,
        },
      });

      expect(response2.status).toBe(200);
      const responseBody2 = await response2.json();
      expect(responseBody2.user_id).toBe(user2.id);

      // Verificar isolamento: cada sessão retorna o usuário correto
      expect(responseBody1.user_id).not.toBe(responseBody2.user_id);
    });
  });
});
