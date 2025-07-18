import orchestrator from "../../orchestrator";
import user from "models/users";
import password from "models/password";
import { version as uuidVersion } from "uuid";

/**
 * TESTES DE INTEGRAÇÃO - ENDPOINT POST /api/v1/users
 *
 * Este arquivo contém testes de integração para o endpoint de criação de usuários.
 * Testa cenários de sucesso e falha, incluindo validações de unicidade de email e nome.
 *
 * Dependências:
 * - orchestrator: Gerencia serviços e banco de dados para testes
 * - user: Model para operações de usuário no banco
 * - password: Utilitário para criptografia de senhas
 * - uuid: Para validação de IDs gerados
 */

/**
 * CONFIGURAÇÃO INICIAL DOS TESTES
 *
 * beforeAll: Executa uma vez antes de todos os testes da suíte
 * - Aguarda todos os serviços ficarem disponíveis
 * - Limpa o banco de dados para garantir estado limpo
 * - Executa migrações pendentes para estrutura atualizada
 */
beforeAll(async () => {
  await orchestrator.waitForAllServices(); // Aguarda serviços (DB, Redis, etc.)
  await orchestrator.clearDatabase(); // Remove dados de testes anteriores
  await orchestrator.runPendingMigrations(); // Aplica mudanças de schema
});

/**
 * SUÍTE DE TESTES - POST /api/v1/users
 * Testa o endpoint de criação de usuários em diferentes cenários
 */
describe("POST /api/v1/users", () => {
  /**
   * CENÁRIOS PARA USUÁRIO ANÔNIMO
   * Testa criação de usuários sem autenticação prévia
   */
  describe("Anonymous user", () => {
    /**
     * TESTE: Criação de usuário com dados únicos e válidos
     *
     * Cenário de sucesso onde todos os dados são válidos e únicos.
     * Verifica estrutura da resposta, criptografia de senha e persistência no banco.
     */
    test("With unique and valid data", async () => {
      // Dados de entrada para criação do usuário
      const userData = {
        nome: "alexandretoulios", // Nome único do usuário
        email: "test@gmail.com", // Email único
        password: "senha123", // Senha em texto plano (será criptografada)
      };

      // Executa requisição POST para criar usuário
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Verifica status HTTP de sucesso (201 Created)
      expect(response.status).toBe(201);

      const responseBody = await response.json();

      // Verifica estrutura completa da resposta
      expect(responseBody).toEqual({
        id: responseBody.id, // UUID v4 gerado automaticamente
        nome: "alexandretoulios", // Nome conforme enviado
        email: "test@gmail.com", // Email conforme enviado
        saldo: 0, // Saldo inicial padrão
        password: responseBody.password, // Senha criptografada (não texto plano)
        created_at: responseBody.created_at, // Timestamp de criação
        updated_at: responseBody.updated_at, // Timestamp de atualização
      });

      // Verifica se ID é UUID v4 válido
      expect(uuidVersion(responseBody.id)).toBe(4);

      // Verifica se timestamps são válidos (não NaN)
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // Verifica se usuário foi persistido no banco de dados
      const userInDatabase = await user.findOneByUsername("alexandretoulios");

      // Testa se a senha foi criptografada corretamente
      const correctPasswordMatch = await password.compare(
        "senha123", // Senha original
        userInDatabase.password // Senha criptografada do banco
      );

      // Testa se senhas incorretas não passam na validação
      const incorrectPasswordMatch = await password.compare(
        "senhaErrada", // Senha incorreta
        userInDatabase.password // Senha criptografada do banco
      );

      expect(correctPasswordMatch).toBe(true); // Senha correta deve passar
      expect(incorrectPasswordMatch).toBe(false); // Senha incorreta deve falhar
    });

    /**
     * TESTE: Tentativa de criação com email duplicado
     *
     * Testa validação de unicidade de email, incluindo case-insensitive.
     * Verifica se sistema rejeita emails duplicados com erro 400.
     */
    test("With duplicated 'email'", async () => {
      // Cria primeiro usuário com email específico
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "emailduplicado1",
          email: "duplicado@gmail.com",
          password: "senha123",
        }),
      });

      // Verifica se primeiro usuário foi criado com sucesso
      expect(response1.status).toBe(201);

      // Tenta criar segundo usuário com mesmo email (case diferente)
      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado2", // ERRO: deveria ser 'nome' em vez de 'username'
          email: "Duplicado@gmail.com", // Mesmo email com case diferente
          password: "senha123",
        }),
      });

      // Verifica se segunda tentativa falha com erro de validação
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      // Verifica estrutura do erro retornado
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O email informado já está send utilizado", // TYPO: "send" deveria ser "sendo"
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    /**
     * TESTE: Tentativa de criação com nome de usuário duplicado
     *
     * Testa validação de unicidade de nome, incluindo case-insensitive.
     * Verifica se sistema rejeita nomes duplicados com erro 400.
     */
    test("With duplicated 'usuario'", async () => {
      // Cria primeiro usuário com nome específico
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "usernameduplicado",
          email: "usernameduplicado1@gmail.com",
          password: "senha123",
        }),
      });

      // Verifica se primeiro usuário foi criado com sucesso
      expect(response1.status).toBe(201);

      // Tenta criar segundo usuário com mesmo nome (case diferente)
      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "UsernameDuplicado", // Mesmo nome com case diferente
          email: "usernameduplicado2@gmail.com",
          password: "senha123",
        }),
      });

      // Verifica se segunda tentativa falha com erro de validação
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      // Verifica estrutura do erro para nome duplicado
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O usuário informado já está send utilizado", // TYPO: "send" deveria ser "sendo"
        action: "Utilize outro nome de usuário para realizar esta operação.",
        status_code: 400,
      });
    });
  });
});
