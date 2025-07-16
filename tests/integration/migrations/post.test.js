import orchestrator from "tests/orchestrator";

/**
 * Configuração inicial dos testes
 * Executada uma única vez antes de todos os testes da suíte
 */
beforeAll(async () => {
  // Aguarda todos os serviços necessários estarem prontos (banco de dados, servidor, etc.)
  await orchestrator.waitForAllServices();

  // Limpa o banco de dados para garantir um estado limpo para os testes
  await orchestrator.clearDatabase();
});

/**
 * Suíte de testes para o endpoint POST /api/v1/migrations
 * Este endpoint é responsável por executar migrações pendentes no banco de dados
 */
describe("POST /api/v1/migrations", () => {
  /**
   * Testes para usuários anônimos (sem autenticação)
   * Verifica se o endpoint funciona corretamente mesmo sem autenticação
   */
  describe("Anonymous user", () => {
    /**
     * Cenário: Execução de migrações pendentes
     * Testa o comportamento do endpoint em diferentes execuções
     */
    describe("Running pending migrations", () => {
      /**
       * Teste: Primeira execução das migrações
       *
       * Cenário: Quando há migrações pendentes para serem executadas
       * Expectativa:
       * - Status 201 (Created) indicando que migrações foram criadas/executadas
       * - Resposta contendo um array com as migrações executadas
       * - Array deve conter pelo menos uma migração
       */
      test("for the first time", async () => {
        // Executa requisição POST para o endpoint de migrações
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          }
        );

        // Verifica se o status é 201 (Created)
        // Indica que migrações foram executadas com sucesso
        expect(response.status).toBe(201);

        // Obtém o corpo da resposta em formato JSON
        const responseBody = await response.json();

        // Verifica se a resposta é um array
        // O endpoint deve retornar uma lista das migrações executadas
        expect(Array.isArray(responseBody)).toBe(true);

        // Verifica se pelo menos uma migração foi executada
        // Em uma primeira execução, espera-se que existam migrações pendentes
        expect(responseBody.length).toBeGreaterThan(0);
      });

      /**
       * Teste: Segunda execução das migrações
       *
       * Cenário: Quando não há migrações pendentes (já foram executadas)
       * Expectativa:
       * - Status 200 (OK) indicando execução bem-sucedida mas sem mudanças
       * - Resposta contendo um array vazio
       * - Array deve estar vazio pois não há migrações pendentes
       */
      test("for the second time", async () => {
        // Executa a mesma requisição novamente
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          }
        );

        // Verifica se o status é 200 (OK)
        // Indica que a requisição foi processada mas nenhuma migração foi executada
        expect(response.status).toBe(200);

        // Obtém o corpo da resposta em formato JSON
        const responseBody = await response.json();

        // Verifica se a resposta continua sendo um array
        expect(Array.isArray(responseBody)).toBe(true);

        // Verifica se o array está vazio
        // Não deve haver migrações pendentes após a primeira execução
        expect(responseBody.length).toBe(0);
      });
    });
  });
});
