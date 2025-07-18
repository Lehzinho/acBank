import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

/**
 * Configuração inicial dos testes
 * Prepara o ambiente de teste garantindo que todos os serviços estejam disponíveis,
 * o banco de dados esteja limpo e as migrações estejam aplicadas
 */
beforeAll(async () => {
  await orchestrator.waitForAllServices(); // Aguarda todos os serviços (banco, API, etc.) estarem online
  await orchestrator.clearDatabase(); // Limpa o banco de dados para evitar interferências entre testes
  await orchestrator.runPendingMigrations(); // Aplica as migrações pendentes para garantir estrutura atualizada
});

/**
 * Testes de integração para o endpoint GET /api/v1/users/[username]
 * Verifica se o endpoint consegue buscar usuários pelo nome de usuário
 */
describe("GET /api/v1/users/[username]", () => {
  /**
   * Testes executados por usuários não autenticados (anônimos)
   * Verifica se o endpoint funciona corretamente sem autenticação
   */
  describe("Anonymous user", () => {
    /**
     * Teste: Busca de usuário com correspondência exata de maiúsculas/minúsculas
     *
     * Cenário: Criar um usuário com nome "MesmoCase" e buscar exatamente por "MesmoCase"
     * Resultado esperado: Usuário deve ser encontrado (status 200) com dados corretos
     */
    test("With exact case match'", async () => {
      // Arrange: Criar um usuário de teste no banco de dados
      await orchestrator.createUser({
        nome: "MesmoCase",
        email: "mesmo.case@gmail.com",
        password: "senha123",
      });

      // Act: Buscar o usuário pelo nome exato (mesma capitalização)
      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/mesmo.case@gmail.com"
      );

      // Assert: Verificar se o usuário foi encontrado
      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      // Assert: Verificar se todos os campos do usuário estão corretos
      expect(response2Body).toEqual({
        id: response2Body.id, // ID deve existir (valor dinâmico)
        nome: "MesmoCase", // Nome deve corresponder exatamente
        email: "mesmo.case@gmail.com", // Email deve corresponder exatamente
        password: response2Body.password, // Senha deve existir (valor dinâmico/hash)
        saldo: 0, // Saldo inicial deve ser 0.00
        created_at: response2Body.created_at, // Data de criação deve existir (valor dinâmico)
        updated_at: response2Body.updated_at, // Data de atualização deve existir (valor dinâmico)
      });

      // Assert: Verificar se o ID é um UUID válido versão 4
      expect(uuidVersion(response2Body.id)).toBe(4);

      // Assert: Verificar se as datas são válidas
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    /**
     * Teste: Busca de usuário com diferença de maiúsculas/minúsculas
     *
     * Cenário: Criar um usuário com nome "CaseDiferente" e buscar por "casediferente" (minúsculas)
     * Resultado esperado: Usuário deve ser encontrado (status 200) mesmo com diferença de case
     */
    test("With exact case mismatch'", async () => {
      // Arrange: Criar um usuário de teste com maiúsculas/minúsculas específicas

      // Arrange: Criar um usuário de teste no banco de dados
      await orchestrator.createUser({
        nome: "CaseDiferente",
        email: "case.diferente@gmail.com",
        password: "senha123",
      });

      // Act: Buscar o usuário usando nome todo em minúsculas
      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/case.diferente@gmail.com"
      );

      // Assert: Verificar se o usuário foi encontrado apesar da diferença de case
      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      // Assert: Verificar se os dados retornados mantêm a capitalização original
      expect(response2Body).toEqual({
        id: response2Body.id,
        nome: "CaseDiferente", // Nome deve manter a capitalização original
        email: "case.diferente@gmail.com",
        password: response2Body.password,
        saldo: 0,
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      // Assert: Verificar integridade dos dados dinâmicos
      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    /**
     * Teste: Busca de usuário inexistente
     *
     * Cenário: Buscar por um usuário que não existe no sistema
     * Resultado esperado: Erro 401 com mensagem apropriada
     */
    test("With nonexistent username'", async () => {
      // Act: Tentar buscar um usuário que não existe
      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente"
      );

      // Assert: Verificar se retorna erro 401
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      // Assert: Verificar se a mensagem de erro está correta e bem estruturada
      expect(responseBody).toEqual({
        action: "Verifique se os dados enviados estão corretos",
        message: "Dados de autenticação não conferem.",
        name: "UnauthorizedError",
        status_code: 401,
      });
    });
  });
});
