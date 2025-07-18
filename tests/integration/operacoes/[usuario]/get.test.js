import orchestrator from "../../../orchestrator";

/**
 * Configuração inicial dos testes
 * - Aguarda todos os serviços estarem online
 * - Limpa a base de dados para isolamento
 * - Executa migrações pendentes
 */
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

/**
 * Suite de testes para o endpoint GET /api/v1/operacoes/{userId}
 * Testa cenários de autenticação e autorização
 */
describe("GET /api/v1/sessions/operacoes/usuario", () => {
  describe("Authenticated user", () => {
    /**
     * Testa se o endpoint rejeita requisições sem token de autenticação
     * Deve retornar 401 com mensagem de erro apropriada
     */
    test("With invalid session token", async () => {
      // Arrange: Cria usuário de teste
      const user = await orchestrator.createUser({
        email: "invalidUser@gmail.com",
        password: "senha-correta",
      });

      // Act: Faz requisição sem cookie de sessão
      const response = await fetch(
        `http://localhost:3000/api/v1/operacoes/${user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Assert: Valida resposta de erro 401
      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action: "Faça login para acessar este recurso.",
        message: "Sessão não encontrada.",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    /**
     * Testa se o endpoint retorna operações quando o usuário está autenticado
     * Deve retornar 200 com array de operações do usuário
     */
    test("With valid session token", async () => {
      // Arrange: Cria usuário de teste
      const user = await orchestrator.createUser({
        email: "validUser@gmail.com",
        password: "senha-correta",
      });

      // Dados para autenticação
      const userData = {
        email: "validUser@gmail.com",
        password: "senha-correta",
      };

      // Act: Faz login para obter token de sessão
      const sessionResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      const session = await sessionResponse.json();

      // Dados para operação de depósito
      const userDepositData = {
        usuario_origem_email: user.email,
        usuario_destino_email: user.email,
        tipo: "DEPOSITO",
        valor: 100000, // R$ 1000.00 (em centavos)
        descricao: "salário",
        user_id: user.id,
      };

      // Cria operação de depósito com token de autenticação
      const depositResponse = await fetch(
        "http://localhost:3000/api/v1/operacoes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`, // Token de autenticação
          },
          body: JSON.stringify(userDepositData),
        }
      );

      // Act: Consulta operações do usuário com token válido
      const response = await fetch(
        `http://localhost:3000/api/v1/operacoes/${user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`, // Token de autenticação
          },
        }
      );

      // Assert: Valida resposta de sucesso
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      // Verifica se retorna array não vazio
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeGreaterThan(0);

      // Valida estrutura da primeira operação
      expect(responseBody[0]).toEqual({
        id: responseBody[0].id, // ID gerado automaticamente
        usuario_destino_id: user.id,
        usuario_origem_id: user.id,
        tipo: "DEPOSITO",
        valor: 100000,
        descricao: "salário",
        created_at: responseBody[0].created_at, // Data gerada automaticamente
        revertida: false, // Operação não revertida
        operacao_original_id: null, // Não é uma reversão
      });
    });
  });
});
