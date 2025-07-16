import orchestrator from "tests/orchestrator";

/**
 * Configuração inicial dos testes
 *
 * beforeAll: Executa uma vez antes de todos os testes
 * - Aguarda todos os serviços ficarem disponíveis
 * - Não limpa o banco (diferente dos testes de usuário)
 * - Garante que dependências estejam prontas para consulta
 *
 * Nota: Não há limpeza de banco pois este endpoint é somente leitura
 * e não modifica dados do sistema.
 */
beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    /**
     * Teste: Recuperação do status atual do sistema
     *
     * Objetivo: Verificar se o endpoint de status retorna informações
     * corretas sobre o estado atual da aplicação e suas dependências.
     *
     * Este teste é crucial para:
     * - Verificar se a aplicação está respondendo corretamente
     * - Validar conectividade com banco de dados
     * - Monitorar recursos e limites do sistema
     * - Garantir que informações de status estão no formato correto
     *
     * Validações realizadas:
     * - Status HTTP 200 (OK)
     * - Timestamp válido no formato ISO
     * - Versão específica do PostgreSQL
     * - Configurações corretas de conexão
     * - Número atual de conexões ativas
     */
    test("Retrieving current system status", async () => {
      // Executa requisição GET para obter status do sistema
      const response = await fetch("http://localhost:3000/api/v1/status");

      // Verifica se endpoint está disponível e respondendo
      expect(response.status).toBe(200);

      // Obtém o corpo da resposta
      const responseBody = await response.json();

      /**
       * Validação de Timestamp
       *
       * Verifica se o campo 'updated_at' contém um timestamp válido
       * no formato ISO 8601. Este campo indica quando o status foi
       * consultado pela última vez.
       *
       * Exemplo esperado: "2024-01-15T10:30:00.000Z"
       */
      const parseUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parseUpdatedAt);

      /**
       * Validação de Versão do Banco de Dados
       *
       * Verifica se a versão do PostgreSQL está correta.
       * Versão "16.0" indica PostgreSQL 16.0, que é uma versão
       * específica esperada no ambiente de desenvolvimento/produção.
       *
       * Importância:
       * - Garantir compatibilidade com features específicas
       * - Monitorar atualizações de segurança
       * - Validar ambiente de execução
       */
      expect(responseBody.dependencies.database.version).toEqual("16.0");

      /**
       * Validação de Configuração de Conexões Máximas
       *
       * Verifica se o limite máximo de conexões está configurado
       * corretamente em 100 conexões simultâneas.
       *
       * Este valor é importante para:
       * - Planejamento de capacidade
       * - Prevenção de esgotamento de recursos
       * - Monitoramento de performance
       * - Alertas de limite próximo ao máximo
       */
      expect(responseBody.dependencies.database.max_connections).toEqual(100);

      /**
       * Validação de Conexões Abertas Atual
       *
       * Verifica se há exatamente 1 conexão ativa no momento.
       * Este valor baixo é esperado em ambiente de testes onde
       * não há carga significativa.
       *
       * Em produção, este valor pode variar significativamente
       * dependendo da carga da aplicação.
       *
       * Monitoramento importante para:
       * - Detectar vazamentos de conexão
       * - Alertar sobre alta utilização
       * - Otimizar pool de conexões
       */
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
    });
  });
});
