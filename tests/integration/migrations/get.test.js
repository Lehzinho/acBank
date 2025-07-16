import orchestrator from "tests/orchestrator";

/**
 * Configuração inicial dos testes
 *
 * beforeAll: Executa uma vez antes de todos os testes
 * - Aguarda todos os serviços ficarem disponíveis
 * - Limpa o banco de dados para garantir estado limpo
 * - NÃO executa migrações pendentes (diferente dos outros testes)
 *
 * Estratégia: Ao limpar o banco sem executar migrações,
 * garantimos que existam migrações pendentes para serem
 * listadas pelo endpoint.
 */
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      // Executa requisição GET para obter migrações pendentes
      const response = await fetch("http://localhost:3000/api/v1/migrations");

      // Verifica se endpoint está disponível e respondendo
      expect(response.status).toBe(200);

      // Obtém o corpo da resposta
      const responseBody = await response.json();

      /**
       * Validação de Formato da Resposta
       *
       * Verifica se a resposta é um array, que é o formato
       * esperado para uma lista de migrações.
       *
       * Estrutura esperada:
       * [
       *   {
       *     "name": "001_create_users_table.sql",
       *     "status": "pending"
       *   },
       *   {
       *     "name": "002_add_indexes.sql",
       *     "status": "pending"
       *   }
       * ]
       */
      expect(Array.isArray(responseBody)).toBe(true);

      /**
       * Validação de Presença de Migrações
       *
       * Verifica se existem migrações pendentes no sistema.
       * Como o banco foi limpo e não executamos migrações,
       * esperamos que existam arquivos de migração a serem
       * aplicados.
       *
       * Este teste falha se:
       * - Não existem arquivos de migração no projeto
       * - Sistema de descoberta de migrações está quebrado
       * - Todas as migrações já foram executadas
       */
      expect(responseBody.length).toBeGreaterThan(0);
    });
  });
});
