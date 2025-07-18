/**
 * TESTE DE INTEGRAÇÃO - API DE OPERAÇÕES FINANCEIRAS
 *
 * Este arquivo contém testes para o endpoint PATCH /api/v1/operacoes/{user_id}/{operation_id}
 * que implementa a funcionalidade de estorno/reembolso de operações financeiras.
 *
 * Funcionalidade testada:
 * - Estorno de transferências entre usuários
 * - Autenticação e autorização
 * - Validação de tokens de sessão
 * - Criação automática de operações de reembolso
 * - Atualização do status da operação original
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
 * Testa o endpoint: PATCH /api/v1/sessions/operacoes/usuario/id
 * (Nota: Parece haver inconsistência na URL comentada vs URL real usada nos testes)
 *
 * Endpoint real testado: PATCH /api/v1/operacoes/{user_id}/{operation_id}
 */
describe("PATCH /api/v1/sessions/operacoes/usuario/id", () => {
  /**
   * GRUPO DE TESTES: Usuário Autenticado
   *
   * Testa diferentes cenários de autenticação e autorização
   */
  describe("Authenticated user", () => {
    /**
     * TESTE 1: Token de Sessão Inválido
     *
     * Objetivo: Verificar se o sistema rejeita requisições sem token válido
     *
     * Cenário:
     * 1. Cria usuário de teste
     * 2. Cria operação de depósito para o usuário
     * 3. Tenta fazer PATCH sem fornecer token de sessão
     * 4. Espera receber erro 401 (Unauthorized)
     */
    test("With invalid session token", async () => {
      // Arrange: Cria dois usuários para teste de transferência
      const user = await orchestrator.createUser({
        email: "invalidUser@gmail.com",
        password: "senha-correta",
      });

      const user2 = await orchestrator.createUser({
        email: "invalidUser2@gmail.com",
        password: "senha-correta",
      });

      // Cria saldo inicial para user (R$ 1000.00)
      await orchestrator.createOperation({
        usuario_origem_email: user.email,
        usuario_destino_email: user.email,
        tipo: "DEPOSITO",
        valor: 100000, // R$ 1000.00 (em centavos)
        descricao: "salário",
        user_id: user.id,
      });

      // Cria transferência de user para user2 (R$ 100.00)
      const userDepositData = await orchestrator.createOperation({
        usuario_origem_email: user.email,
        usuario_destino_email: user2.email,
        tipo: "TRANSFERENCIA",
        valor: 10000, // R$ 100.00 (em centavos)
        descricao: "salário",
        user_id: user.id,
      });

      // Act: Solicita estorno da transferência
      const depositBody = { descricao: "Valor estornado" };
      const depositResponse = await fetch(
        `http://localhost:3000/api/v1/operacoes/${user2.id}/${userDepositData.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(depositBody),
        }
      );

      // Assert: Verifica se retorna erro 401
      expect(depositResponse.status).toBe(401);

      // Verifica estrutura da resposta de erro
      const responseBody = await depositResponse.json();
      expect(responseBody).toEqual({
        action: "Faça login para acessar este recurso.",
        message: "Usuario não autorizado.",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });

    /**
     * TESTE 2: Token de Sessão Válido
     *
     * Objetivo: Verificar se o sistema processa corretamente o estorno de uma transferência
     *
     * Cenário:
     * 1. Cria dois usuários (remetente e destinatário)
     * 2. Usuário 1 recebe depósito inicial (R$ 1000.00)
     * 3. Usuário 1 transfere R$ 100.00 para Usuário 2
     * 4. Usuário 1 solicita estorno da transferência
     * 5. Sistema deve criar operação de reembolso e marcar original como estornada
     */
    test("With valid session token", async () => {
      // Arrange: Cria dois usuários para teste de transferência
      const user = await orchestrator.createUser({
        email: "validUser@gmail.com",
        password: "senha-correta",
      });

      const user2 = await orchestrator.createUser({
        email: "validUser2@gmail.com",
        password: "senha-correta",
      });

      // Cria saldo inicial para user (R$ 1000.00)
      const initialBalance = await orchestrator.createOperation({
        usuario_origem_email: user.email,
        usuario_destino_email: user.email,
        tipo: "DEPOSITO",
        valor: 100000, // R$ 1000.00 (em centavos)
        descricao: "salário",
        user_id: user.id,
      });

      // Cria transferência de user para user2 (R$ 100.00)
      const userDepositData = await orchestrator.createOperation({
        usuario_origem_email: user.email,
        usuario_destino_email: user2.email,
        tipo: "TRANSFERENCIA",
        valor: 10000, // R$ 100.00 (em centavos)
        descricao: "salário",
        user_id: user.id,
      });

      // Cria token de sessão válido para user
      const session = await orchestrator.createToken(user.id);

      // Act: Solicita estorno da transferência
      const depositBody = { descricao: "Valor estornado" };
      const depositResponse = await fetch(
        `http://localhost:3000/api/v1/operacoes/${user2.id}/${userDepositData.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`, // Inclui token de autenticação
          },
          body: JSON.stringify(depositBody),
        }
      );

      // Assert: Verifica se operação foi bem-sucedida
      expect(depositResponse.status).toBe(201);

      const responseBody = await depositResponse.json();

      /**
       * VALIDAÇÃO DA RESPOSTA
       *
       * O sistema deve retornar:
       * 1. operacao_nova: Operação de reembolso criada
       * 2. operacao_original: Operação original marcada como estornada
       */
      expect(responseBody).toEqual({
        // Operação de reembolso criada automaticamente
        operacao_nova: {
          id: responseBody.operacao_nova.id,
          usuario_origem_id: user2.id, // Quem estava com o dinheiro
          usuario_destino_id: user.id, // Quem recebe o estorno
          tipo: "REINBOLSO", // Tipo da nova operação
          valor: 10000, // Mesmo valor da operação original
          descricao: depositBody.descricao, // Descrição fornecida na requisição
          created_at: responseBody.operacao_nova.created_at,
          revertida: false, // Nova operação não está revertida
          operacao_original_id: userDepositData.id, // Referência à operação original
          senderBalance: 0, // Saldo do remetente após estorno
          receiverBalance: initialBalance.valor, // Saldo do destinatário após estorno
        },
        // Operação original atualizada
        operacao_original: {
          id: responseBody.operacao_original.id,
          usuario_origem_id: user.id, // Remetente original
          usuario_destino_id: user2.id, // Destinatário original
          tipo: "ESTORNADA", // Tipo alterado para indicar estorno
          valor: 10000, // Valor original mantido
          descricao: userDepositData.descricao, // Descrição original mantida
          created_at: responseBody.operacao_original.created_at,
          revertida: true, // Marcada como revertida
          operacao_original_id: null, // Não referencia outra operação
        },
      });
    });
  });
});
