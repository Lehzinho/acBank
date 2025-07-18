import orchestrator from "../../orchestrator";

/**
 * Configuração inicial dos testes
 * - Aguarda todos os serviços estarem prontos
 * - Limpa o banco de dados para testes isolados
 * - Executa migrações pendentes
 */
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

/**
 * Conjunto de testes para o endpoint POST /api/v1/operacoes
 * Testa operações financeiras (DEPOSITO e TRANSFERENCIA)
 */
describe("POST /api/v1/operacoes", () => {
  describe("Authenticated user", () => {
    /**
     * Teste 1: Verifica se operação falha sem autenticação
     * - Cria usuário sem fazer login
     * - Tenta fazer depósito sem token de sessão
     * - Espera erro 401 (Unauthorized)
     */
    test("Transaction should fail, NOT authenticated user DEPOSITO", async () => {
      // Cria usuário de teste
      const user = await orchestrator.createUser({});

      // Dados para operação de depósito
      const userData = {
        usuario_origem_id: user.id,
        usuario_destino_id: user.id,
        tipo: "DEPOSITO",
        valor: 100000, // R$ 1.000,00 (em centavos)
        descricao: "salário",
        user_id: user.id,
      };

      // Faz requisição sem token de autenticação
      const response = await fetch("http://localhost:3000/api/v1/operacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Verifica se retorna erro 401
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      // Verifica estrutura da resposta de erro
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuario não autorizado.",
        action: "Faça login para acessar este recurso.",
        status_code: 401,
      });
    });

    /**
     * Teste 2: Verifica se depósito funciona com usuário autenticado
     * - Cria usuário e faz login
     * - Executa depósito com token de sessão válido
     * - Verifica resposta e saldos atualizados
     */
    test("Transaction should not fail DEPOSITO", async () => {
      // Cria usuário com credenciais específicas
      const user = await orchestrator.createUser({
        email: "test@gmail.com",
        password: "senha-correta",
      });

      // Dados para login
      const userData = {
        email: "test@gmail.com",
        password: "senha-correta",
      };

      // Faz login para obter token de sessão
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
        valor: 100000,
        descricao: "salário",
        user_id: user.id,
      };

      // Executa depósito com token de autenticação
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

      // Verifica se operação foi bem-sucedida
      expect(depositResponse.status).toBe(201);

      const responseBody = await depositResponse.json();

      // Verifica estrutura da resposta de sucesso
      expect(responseBody).toEqual({
        id: responseBody.id,
        usuario_origem_id: user.id,
        usuario_destino_id: user.id,
        tipo: "DEPOSITO",
        valor: userDepositData.valor,
        descricao: "salário",
        created_at: responseBody.created_at,
        revertida: false,
        operacao_original_id: null,
        receiverBalance: userDepositData.valor + user.saldo,
        senderBalance: user.saldo,
      });
    });

    /**
     * Teste 3: Verifica se transferência falha com saldo insuficiente
     * - Cria usuário sem saldo
     * - Tenta fazer transferência sem fundos suficientes
     * - Espera erro 400 (Bad Request)
     */
    test("Transaction should fail insuficient funds TRANSFERENCIA", async () => {
      // Cria usuário remetente
      const userSender = await orchestrator.createUser({
        email: "Sender1@gmail.com",
        password: "senha-correta",
      });

      // Dados para login
      const userData = {
        email: "Sender1@gmail.com",
        password: "senha-correta",
      };

      // Faz login
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

      // Dados para transferência (sem saldo suficiente)
      const userDepositData = {
        usuario_origem_email: userSender.email,
        usuario_destino_email: userSender.email,
        tipo: "TRANSFERENCIA",
        valor: 100000,
        descricao: "salário",
        user_id: userSender.id,
      };

      // Tenta fazer transferência sem saldo
      const depositResponse = await fetch(
        "http://localhost:3000/api/v1/operacoes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify(userDepositData),
        }
      );

      // Verifica se retorna erro 400
      expect(depositResponse.status).toBe(400);

      const responseBody = await depositResponse.json();

      // Verifica mensagem de erro por fundos insuficientes
      expect(responseBody).toEqual({
        action: "Verifique o saldo da conta.",
        message: "Fundos insuficientes.",
        name: "ValidationError",
        status_code: 400,
      });
    });

    /**
     * Teste 4: Verifica transferência bem-sucedida com saldo suficiente
     * - Cria usuário remetente e destinatário
     * - Faz depósito inicial para garantir saldo
     * - Executa transferência entre usuários
     * - Verifica saldos atualizados corretamente
     */
    test("Transaction with suficient funds TRANSFERENCIA", async () => {
      // Cria usuário remetente
      const userSender = await orchestrator.createUser({
        email: "userSender@gmail.com",
        password: "senha-correta",
      });

      // Cria usuário destinatário
      const userReceiver = await orchestrator.createUser({});

      // Dados para login do remetente
      const userData = {
        email: "userSender@gmail.com",
        password: "senha-correta",
      };

      // Faz login
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

      // Primeiro: faz depósito para garantir saldo
      const userSenderDepositData = {
        usuario_origem_email: userSender.email,
        usuario_destino_email: userSender.email,
        tipo: "DEPOSITO",
        valor: 100000, // R$ 1.000,00
        descricao: "salário",
        user_id: userSender.id,
      };

      const depositResponse = await fetch(
        "http://localhost:3000/api/v1/operacoes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify(userSenderDepositData),
        }
      );

      expect(depositResponse.status).toBe(201);
      const depositResponseBody = await depositResponse.json();

      // Segundo: faz transferência para outro usuário
      const userSenderTransferData = {
        usuario_origem_email: userSender.email,
        usuario_destino_email: userReceiver.email,
        tipo: "TRANSFERENCIA",
        valor: 80000, // R$ 800,00
        descricao: "salário",
        user_id: userSender.id,
      };

      const transferResponse = await fetch(
        "http://localhost:3000/api/v1/operacoes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify(userSenderTransferData),
        }
      );

      // Verifica se transferência foi bem-sucedida
      expect(transferResponse.status).toEqual(201);
      const transerResponseBody = await transferResponse.json();

      // Verifica estrutura da resposta e cálculos de saldo
      expect(transerResponseBody).toEqual({
        id: transerResponseBody.id,
        usuario_origem_id: userSender.id,
        usuario_destino_id: userReceiver.id,
        tipo: "TRANSFERENCIA",
        valor: 80000,
        descricao: "salário",
        created_at: transerResponseBody.created_at,
        revertida: false,
        operacao_original_id: null,
        senderBalance:
          depositResponseBody.receiverBalance - transerResponseBody.valor,
        receiverBalance: userReceiver.saldo + transerResponseBody.valor,
      });
    });
  });
});
