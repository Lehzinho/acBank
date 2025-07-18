/**
 * TESTE DE INTEGRAÇÃO - CONSULTA DE OPERAÇÕES FINANCEIRAS
 *
 * Este arquivo contém testes para o endpoint GET /api/v1/operacoes/{user_id}/{operation_id}
 * que implementa a funcionalidade de consulta de uma operação financeira específica.
 *
 * Funcionalidade testada:
 * - Consulta de operação por ID
 * - Autenticação e autorização
 * - Validação de tokens de sessão
 * - Retorno dos dados da operação
 */

import orchestrator from "../../../../orchestrator";

/**
 * CONFIGURAÇÃO INICIAL DOS TESTES
 *
 * beforeAll: Executado uma vez antes de todos os testes do arquivo
 * - Aguarda todos os serviços estarem prontos
 * - Limpa o banco de dados para garantir ambiente limpo
 * - Executa migrações pendentes do banco
 */
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

/**
 * SUITE DE TESTES PRINCIPAL
 *
 * Testa o endpoint: GET /api/v1/sessions/operacoes/usuario/id
 * (Nota: Parece haver inconsistência na URL comentada vs URL real usada nos testes)
 *
 * Endpoint real testado: GET /api/v1/operacoes/{user_id}/{operation_id}
 */
describe("GET /api/v1/sessions/operacoes/usuario/id", () => {
  /**
   * GRUPO DE TESTES: Usuário Autenticado
   *
   * Testa diferentes cenários de autenticação e autorização
   */
  describe("Authenticated user", () => {
    /**
     * TESTE 1: Token de Sessão Inválido
     *
     * Objetivo: Verificar se o sistema rejeita consultas sem token válido
     *
     * Cenário:
     * 1. Cria usuário de teste
     * 2. Cria operação de depósito para o usuário
     * 3. Tenta consultar operação sem fornecer token de sessão
     * 4. Espera receber erro 401 (Unauthorized)
     */
    test("With invalid session token", async () => {
      // Arrange: Cria usuário de teste
      const user = await orchestrator.createUser({
        email: "invalidUser@gmail.com",
        password: "senha-correta",
      });

      // Cria operação de depósito para consulta
      const depositResponse = await orchestrator.createOperation({
        usuario_origem_email: user.email,
        usuario_destino_email: user.email,
        tipo: "DEPOSITO",
        valor: 100000, // R$ 1000.00 (em centavos)
        descricao: "salário",
        user_id: user.id,
      });

      // Act: Consulta operação com token válido
      const response = await fetch(
        `http://localhost:3000/api/v1/operacoes/${user.id}/${depositResponse.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Assert: Verifica se retorna erro 401
      expect(response.status).toBe(401);

      // Verifica estrutura da resposta de erro
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action: "Faça login para acessar este recurso.",
        message: "Sessão não encontrada.", // Mensagem específica para GET
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    /**
     * TESTE 2: Token de Sessão Válido
     *
     * Objetivo: Verificar se o sistema retorna corretamente os dados da operação
     *
     * Cenário:
     * 1. Cria usuário de teste
     * 2. Cria token de sessão válido
     * 3. Cria operação de depósito
     * 4. Consulta operação com token válido
     * 5. Verifica se retorna dados corretos da operação
     */
    test("With valid session token", async () => {
      // Arrange: Cria usuário de teste
      const user = await orchestrator.createUser({
        email: "validUser@gmail.com",
        password: "senha-correta",
      });

      // Cria token de sessão válido para o usuário
      const session = await orchestrator.createToken(user.id);

      // Cria operação de depósito para consulta
      const depositResponse = await orchestrator.createOperation({
        usuario_origem_email: user.email,
        usuario_destino_email: user.email,
        tipo: "DEPOSITO",
        valor: 100000, // R$ 1000.00 (em centavos)
        descricao: "salário",
        user_id: user.id,
      });

      // Act: Consulta operação com token válido
      const response = await fetch(
        `http://localhost:3000/api/v1/operacoes/${user.id}/${depositResponse.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`, // Inclui token de autenticação
          },
        }
      );

      // Assert: Verifica se consulta foi bem-sucedida
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      /**
       * VALIDAÇÃO DA RESPOSTA
       *
       * O sistema deve retornar todos os dados da operação:
       * - IDs únicos (gerados pelo sistema)
       * - Dados da operação (tipo, valor, descrição)
       * - Metadados (data de criação, status de reversão)
       * - Referências (operação original, se aplicável)
       */
      expect(responseBody).toEqual({
        id: responseBody.id, // ID único da operação
        usuario_origem_id: responseBody.usuario_origem_id, // ID do usuário remetente
        usuario_destino_id: responseBody.usuario_destino_id, // ID do usuário destinatário
        tipo: depositResponse.tipo, // Tipo da operação ("DEPOSITO")
        valor: depositResponse.valor, // Valor em centavos (100000)
        descricao: depositResponse.descricao, // Descrição fornecida ("salário")
        created_at: responseBody.created_at, // Data/hora de criação
        revertida: false, // Status de reversão (false = não revertida)
        operacao_original_id: null, // ID da operação original (null = operação original)
      });
    });
  });
});
